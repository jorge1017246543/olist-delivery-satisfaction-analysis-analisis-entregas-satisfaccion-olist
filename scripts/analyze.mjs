import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(process.argv[2] ?? '.');
const raw = (name) => resolve(root, 'data/raw', name);
const processed = resolve(root, 'data/processed');
const DAY_MS = 86_400_000;

function parseCsv(text) {
  const rows = [];
  let row = [];
  let value = '';
  let quoted = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    if (quoted) {
      if (char === '"' && text[i + 1] === '"') {
        value += '"';
        i += 1;
      } else if (char === '"') {
        quoted = false;
      } else {
        value += char;
      }
    } else if (char === '"') {
      quoted = true;
    } else if (char === ',') {
      row.push(value);
      value = '';
    } else if (char === '\n') {
      row.push(value.replace(/\r$/, ''));
      if (row.some((cell) => cell !== '')) rows.push(row);
      row = [];
      value = '';
    } else {
      value += char;
    }
  }
  if (value.length || row.length) {
    row.push(value.replace(/\r$/, ''));
    if (row.some((cell) => cell !== '')) rows.push(row);
  }

  const headers = (rows.shift() ?? []).map((header, index) =>
    index === 0 ? header.replace(/^\uFEFF/, '') : header,
  );
  return rows.map((cells) => Object.fromEntries(headers.map((header, index) => [header, cells[index] ?? ''])));
}

async function loadCsv(fileName) {
  return parseCsv(await readFile(raw(fileName), 'utf8'));
}

function dayNumber(timestamp) {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(timestamp ?? '');
  if (!match) return null;
  return Math.floor(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])) / DAY_MS);
}

function round(value, digits = 2) {
  if (!Number.isFinite(value)) return null;
  const factor = 10 ** digits;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

function csvCell(value) {
  if (value === null || value === undefined) return '';
  const text = String(value);
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

async function writeCsv(fileName, records) {
  const columns = records.length ? Object.keys(records[0]) : [];
  const content = [columns, ...records.map((record) => columns.map((column) => record[column]))]
    .map((cells) => cells.map(csvCell).join(','))
    .join('\r\n');
  await writeFile(resolve(processed, fileName), `${content}\r\n`, 'utf8');
}

function rate(numerator, denominator) {
  return denominator ? (numerator / denominator) * 100 : null;
}

function makeAccumulator() {
  return {
    delivered_orders: 0,
    late_orders: 0,
    reviewed_orders: 0,
    low_review_orders: 0,
    review_score_sum: 0,
    delay_days_sum: 0,
    late_days_sum: 0,
  };
}

function addOrder(acc, order) {
  acc.delivered_orders += 1;
  if (order.days_late > 0) {
    acc.late_orders += 1;
    acc.late_days_sum += order.days_late;
  }
  if (order.review_score !== null) {
    acc.reviewed_orders += 1;
    acc.review_score_sum += order.review_score;
    if (order.is_low_review) acc.low_review_orders += 1;
  }
  acc.delay_days_sum += order.delivery_days;
}

function finalizeGroup(key, acc) {
  return {
    [key]: acc.group,
    delivered_orders: acc.delivered_orders,
    late_orders: acc.late_orders,
    late_rate_pct: round(rate(acc.late_orders, acc.delivered_orders)),
    avg_days_late: round(acc.late_days_sum / acc.late_orders),
    reviewed_orders: acc.reviewed_orders,
    avg_review_score: round(acc.review_score_sum / acc.reviewed_orders),
    low_review_orders: acc.low_review_orders,
    low_review_rate_pct: round(rate(acc.low_review_orders, acc.reviewed_orders)),
    avg_delivery_days: round(acc.delay_days_sum / acc.delivered_orders),
  };
}

const [orders, reviews, customers, items, products, translations] = await Promise.all([
  loadCsv('olist_orders_dataset.csv'),
  loadCsv('olist_order_reviews_dataset.csv'),
  loadCsv('olist_customers_dataset.csv'),
  loadCsv('olist_order_items_dataset.csv'),
  loadCsv('olist_products_dataset.csv'),
  loadCsv('product_category_name_translation.csv'),
]);

const reviewsByOrder = new Map();
for (const review of reviews) {
  const score = Number(review.review_score);
  if (!Number.isFinite(score)) continue;
  const current = reviewsByOrder.get(review.order_id) ?? { sum: 0, count: 0 };
  current.sum += score;
  current.count += 1;
  reviewsByOrder.set(review.order_id, current);
}

const customerState = new Map(customers.map((customer) => [customer.customer_id, customer.customer_state || 'Unknown']));
const delivered = [];
const deliveredIds = new Set();
for (const row of orders) {
  if (row.order_status !== 'delivered') continue;
  const purchaseDay = dayNumber(row.order_purchase_timestamp);
  const actualDay = dayNumber(row.order_delivered_customer_date);
  const estimateDay = dayNumber(row.order_estimated_delivery_date);
  if (purchaseDay === null || actualDay === null || estimateDay === null) continue;
  const review = reviewsByOrder.get(row.order_id);
  const reviewScore = review ? review.sum / review.count : null;
  delivered.push({
    order_id: row.order_id,
    purchase_date: row.order_purchase_timestamp.slice(0, 10),
    purchase_month: row.order_purchase_timestamp.slice(0, 7),
    customer_state: customerState.get(row.customer_id) ?? 'Unknown',
    delivery_days: actualDay - purchaseDay,
    days_late: actualDay - estimateDay,
    review_score: reviewScore === null ? null : round(reviewScore, 4),
    review_count: review?.count ?? 0,
    is_low_review: reviewScore !== null && reviewScore <= 2,
  });
  deliveredIds.add(row.order_id);
}

const duplicateReviewOrders = [...reviewsByOrder.values()].filter((review) => review.count > 1).length;
const reviewed = delivered.filter((order) => order.review_score !== null);

const lateAndOnTime = ['A tiempo o antes', 'Tarde'].map((label) => {
  const group = reviewed.filter((order) => (order.days_late > 0) === (label === 'Tarde'));
  const low = group.filter((order) => order.is_low_review).length;
  return {
    delivery_status: label,
    reviewed_orders: group.length,
    avg_review_score: round(group.reduce((sum, order) => sum + order.review_score, 0) / group.length),
    low_review_orders: low,
    low_review_rate_pct: round(rate(low, group.length)),
    high_review_rate_pct: round(rate(group.filter((order) => order.review_score >= 4).length, group.length)),
  };
});
const lateReviewed = reviewed.filter((order) => order.days_late > 0);
const lowReviewCount = reviewed.filter((order) => order.is_low_review).length;

const delayBands = [
  { label: 'A tiempo o antes', test: (days) => days <= 0 },
  { label: '1–3 días tarde', test: (days) => days >= 1 && days <= 3 },
  { label: '4–7 días tarde', test: (days) => days >= 4 && days <= 7 },
  { label: '8–14 días tarde', test: (days) => days >= 8 && days <= 14 },
  { label: '15+ días tarde', test: (days) => days >= 15 },
].map(({ label, test }) => {
  const group = reviewed.filter((order) => test(order.days_late));
  return {
    delay_band: label,
    reviewed_orders: group.length,
    avg_review_score: round(group.reduce((sum, order) => sum + order.review_score, 0) / group.length),
    low_review_orders: group.filter((order) => order.is_low_review).length,
    low_review_rate_pct: round(rate(group.filter((order) => order.is_low_review).length, group.length)),
  };
});

const stateGroups = new Map();
for (const order of delivered) {
  const acc = stateGroups.get(order.customer_state) ?? makeAccumulator();
  acc.group = order.customer_state;
  addOrder(acc, order);
  stateGroups.set(order.customer_state, acc);
}
const stateSummary = [...stateGroups.values()]
  .map((acc) => finalizeGroup('state', acc))
  .sort((a, b) => b.delivered_orders - a.delivered_orders);

const translatedCategory = new Map(translations.map((row) => [row.product_category_name, row.product_category_name_english]));
const productCategory = new Map(products.map((product) => [
  product.product_id,
  translatedCategory.get(product.product_category_name) || product.product_category_name || 'unknown',
]));
const categoriesByOrder = new Map();
for (const item of items) {
  if (!deliveredIds.has(item.order_id)) continue;
  const category = productCategory.get(item.product_id) || 'unknown';
  const categories = categoriesByOrder.get(item.order_id) ?? new Set();
  categories.add(category);
  categoriesByOrder.set(item.order_id, categories);
}
const categoryGroups = new Map();
for (const order of delivered) {
  const categories = categoriesByOrder.get(order.order_id) ?? new Set(['unknown']);
  for (const category of categories) {
    const acc = categoryGroups.get(category) ?? makeAccumulator();
    acc.group = category;
    addOrder(acc, order);
    categoryGroups.set(category, acc);
  }
}
const categorySummary = [...categoryGroups.values()]
  .map((acc) => finalizeGroup('category', acc))
  .sort((a, b) => b.delivered_orders - a.delivered_orders);

const monthGroups = new Map();
for (const order of delivered) {
  const acc = monthGroups.get(order.purchase_month) ?? makeAccumulator();
  acc.group = order.purchase_month;
  addOrder(acc, order);
  monthGroups.set(order.purchase_month, acc);
}
const monthlySummary = [...monthGroups.values()]
  .map((acc) => finalizeGroup('purchase_month', acc))
  .sort((a, b) => a.purchase_month.localeCompare(b.purchase_month));

const lowReviewGroups = [
  { label: 'Baja (1–2)', test: (order) => order.review_score <= 2 },
  { label: 'Media (3)', test: (order) => order.review_score > 2 && order.review_score < 4 },
  { label: 'Alta (4–5)', test: (order) => order.review_score >= 4 },
].map(({ label, test }) => {
  const group = reviewed.filter(test);
  return { review_band: label, reviewed_orders: group.length, share_pct: round(rate(group.length, reviewed.length)) };
});

const onTime = lateAndOnTime.find((row) => row.delivery_status === 'A tiempo o antes');
const late = lateAndOnTime.find((row) => row.delivery_status === 'Tarde');
const overall = {
  source_orders: orders.length,
  source_review_rows: reviews.length,
  delivered_orders_with_complete_dates: delivered.length,
  delivered_orders_with_review: reviewed.length,
  late_orders: delivered.filter((order) => order.days_late > 0).length,
  late_rate_pct: round(rate(delivered.filter((order) => order.days_late > 0).length, delivered.length)),
  avg_days_late_when_late: round(delivered.filter((order) => order.days_late > 0).reduce((sum, order) => sum + order.days_late, 0) / delivered.filter((order) => order.days_late > 0).length),
  reviewed_late_orders: lateReviewed.length,
  low_review_orders: lowReviewCount,
  low_review_rate_overall_pct: round(rate(lowReviewCount, reviewed.length)),
  avg_review_on_time: onTime.avg_review_score,
  avg_review_late: late.avg_review_score,
  review_score_difference_late_minus_on_time: round(late.avg_review_score - onTime.avg_review_score),
  low_review_rate_on_time_pct: onTime.low_review_rate_pct,
  low_review_rate_late_pct: late.low_review_rate_pct,
  low_review_risk_ratio_late_vs_on_time: round(late.low_review_rate_pct / onTime.low_review_rate_pct),
  low_review_rate_difference_percentage_points: round(late.low_review_rate_pct - onTime.low_review_rate_pct),
  share_of_low_reviews_from_late_orders_pct: round(rate(lateReviewed.filter((order) => order.is_low_review).length, lowReviewCount)),
  rating_mean_for_multiple_reviews_by_order: true,
  orders_with_multiple_review_rows: duplicateReviewOrders,
  low_review_definition: 'order-level mean review_score <= 2',
  late_definition: 'calendar day of actual delivery > calendar day of estimated delivery',
};

const orderDetail = delivered.map((order) => ({
  order_id: order.order_id,
  purchase_date: order.purchase_date,
  purchase_month: order.purchase_month,
  customer_state: order.customer_state,
  delivery_days: order.delivery_days,
  days_late: order.days_late,
  delivery_status: order.days_late > 0 ? 'Tarde' : 'A tiempo o antes',
  review_score: order.review_score,
  review_count: order.review_count,
  low_review: order.review_score === null ? null : order.is_low_review,
}));

await writeCsv('order_delivery_review.csv', orderDetail);
await writeCsv('late_vs_review.csv', lateAndOnTime);
await writeCsv('delay_bands.csv', delayBands);
await writeCsv('review_bands.csv', lowReviewGroups);
await writeCsv('state_summary.csv', stateSummary);
await writeCsv('category_summary.csv', categorySummary);
await writeCsv('monthly_summary.csv', monthlySummary);
await writeCsv('overall_summary.csv', [overall]);
await writeFile(resolve(processed, 'analysis_run.json'), `${JSON.stringify({
  run_utc: new Date().toISOString(),
  input_rows: {
    orders: orders.length,
    reviews: reviews.length,
    customers: customers.length,
    order_items: items.length,
    products: products.length,
  },
  quality_checks: {
    complete_delivered_orders: delivered.length,
    delivered_orders_with_review: reviewed.length,
    orders_with_multiple_review_rows: duplicateReviewOrders,
    delivered_orders_without_customer_state: delivered.filter((order) => order.customer_state === 'Unknown').length,
    delivered_orders_without_any_items: delivered.filter((order) => !categoriesByOrder.has(order.order_id)).length,
    delivered_orders_with_unknown_category: [...categoriesByOrder.values()].filter((categorySet) => categorySet.has('unknown')).length,
  },
  definitions: {
    late: 'Calendar day of actual customer delivery is after estimated delivery day.',
    review_by_order: 'Arithmetic mean of all numeric review_score rows for an order.',
    low_review: 'Order-level mean review_score <= 2.',
    category: 'A multi-category order is counted once in each category it contains; category totals therefore do not sum to unique orders.',
  },
  overall,
}, null, 2)}\n`, 'utf8');

console.log(JSON.stringify(overall, null, 2));

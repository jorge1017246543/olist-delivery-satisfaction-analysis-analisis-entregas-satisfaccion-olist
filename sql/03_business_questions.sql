.headers on
.mode column

-- 1. KPI principales: las tasas de entrega usan todos los pedidos entregados con fechas completas.
SELECT
  COUNT(*) AS delivered_orders,
  SUM(late_flag) AS late_orders,
  ROUND(100.0 * SUM(late_flag) / COUNT(*), 2) AS late_rate_pct,
  ROUND(AVG(CASE WHEN late_flag = 1 THEN days_late END), 2) AS avg_days_late_when_late,
  SUM(CASE WHEN review_score IS NOT NULL THEN 1 ELSE 0 END) AS reviewed_orders
FROM v_order_delivery_review;

-- 2. Asociación entre tardanza y satisfacción. Solo incluye pedidos con reseña.
SELECT
  CASE WHEN late_flag = 1 THEN 'Tarde' ELSE 'A tiempo o antes' END AS delivery_status,
  COUNT(*) AS reviewed_orders,
  ROUND(AVG(review_score), 2) AS avg_review_score,
  SUM(low_review_flag) AS low_review_orders,
  ROUND(100.0 * SUM(low_review_flag) / COUNT(*), 2) AS low_review_rate_pct,
  ROUND(100.0 * SUM(CASE WHEN review_score >= 4 THEN 1 ELSE 0 END) / COUNT(*), 2) AS high_review_rate_pct
FROM v_order_delivery_review
WHERE review_score IS NOT NULL
GROUP BY late_flag
ORDER BY late_flag;

-- 3. Intensidad de tardanza. La tasa baja se define como promedio de reseñas por pedido <= 2.
SELECT
  CASE
    WHEN days_late <= 0 THEN 'A tiempo o antes'
    WHEN days_late BETWEEN 1 AND 3 THEN '1-3 días tarde'
    WHEN days_late BETWEEN 4 AND 7 THEN '4-7 días tarde'
    WHEN days_late BETWEEN 8 AND 14 THEN '8-14 días tarde'
    ELSE '15+ días tarde'
  END AS delay_band,
  COUNT(*) AS reviewed_orders,
  ROUND(AVG(review_score), 2) AS avg_review_score,
  SUM(low_review_flag) AS low_review_orders,
  ROUND(100.0 * SUM(low_review_flag) / COUNT(*), 2) AS low_review_rate_pct
FROM v_order_delivery_review
WHERE review_score IS NOT NULL
GROUP BY delay_band
ORDER BY MIN(days_late);

-- 4. Geografía: mínimo de 500 pedidos para evitar interpretar grupos pequeños.
SELECT
  customer_state,
  COUNT(*) AS delivered_orders,
  SUM(late_flag) AS late_orders,
  ROUND(100.0 * SUM(late_flag) / COUNT(*), 2) AS late_rate_pct,
  ROUND(AVG(review_score), 2) AS avg_review_score,
  ROUND(100.0 * SUM(low_review_flag) / SUM(CASE WHEN review_score IS NOT NULL THEN 1 ELSE 0 END), 2) AS low_review_rate_pct
FROM v_order_delivery_review
GROUP BY customer_state
HAVING COUNT(*) >= 500
ORDER BY late_rate_pct DESC;

-- 5. Categoría: los pedidos con más de una categoría aparecen una vez en cada categoría.
SELECT
  category,
  COUNT(DISTINCT order_id) AS delivered_orders,
  ROUND(100.0 * SUM(late_flag) / COUNT(DISTINCT order_id), 2) AS late_rate_pct,
  ROUND(AVG(review_score), 2) AS avg_review_score,
  ROUND(100.0 * SUM(low_review_flag) / SUM(CASE WHEN review_score IS NOT NULL THEN 1 ELSE 0 END), 2) AS low_review_rate_pct
FROM v_order_category_outcomes
GROUP BY category
HAVING COUNT(DISTINCT order_id) >= 500
ORDER BY low_review_rate_pct DESC;

-- 6. Tendencia mensual. Los meses de muy bajo volumen son parciales y deben excluirse al presentar.
SELECT
  purchase_month,
  COUNT(*) AS delivered_orders,
  ROUND(100.0 * SUM(late_flag) / COUNT(*), 2) AS late_rate_pct,
  ROUND(AVG(review_score), 2) AS avg_review_score,
  ROUND(100.0 * SUM(low_review_flag) / SUM(CASE WHEN review_score IS NOT NULL THEN 1 ELSE 0 END), 2) AS low_review_rate_pct
FROM v_order_delivery_review
GROUP BY purchase_month
ORDER BY purchase_month;

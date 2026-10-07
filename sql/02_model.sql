-- Consolida reseñas antes de cruzarlas con pedidos para mantener una fila por pedido.
DROP VIEW IF EXISTS v_reviews_by_order;
CREATE VIEW v_reviews_by_order AS
SELECT
  order_id,
  AVG(CAST(review_score AS REAL)) AS review_score,
  COUNT(review_score) AS review_rows
FROM olist_order_reviews_dataset
WHERE review_score IS NOT NULL
GROUP BY order_id;

-- Una fila por pedido entregado con fechas completas. La tardanza usa días calendario.
DROP VIEW IF EXISTS v_order_delivery_review;
CREATE VIEW v_order_delivery_review AS
SELECT
  o.order_id,
  o.customer_id,
  c.customer_state,
  substr(o.order_purchase_timestamp, 1, 10) AS purchase_date,
  substr(o.order_purchase_timestamp, 1, 7) AS purchase_month,
  CAST(julianday(date(o.order_delivered_customer_date)) - julianday(date(o.order_purchase_timestamp)) AS INTEGER) AS delivery_days,
  CAST(julianday(date(o.order_delivered_customer_date)) - julianday(date(o.order_estimated_delivery_date)) AS INTEGER) AS days_late,
  CASE
    WHEN date(o.order_delivered_customer_date) > date(o.order_estimated_delivery_date) THEN 1
    ELSE 0
  END AS late_flag,
  r.review_score,
  COALESCE(r.review_rows, 0) AS review_rows,
  CASE WHEN r.review_score <= 2 THEN 1 WHEN r.review_score IS NULL THEN NULL ELSE 0 END AS low_review_flag
FROM olist_orders_dataset AS o
LEFT JOIN olist_customers_dataset AS c ON c.customer_id = o.customer_id
LEFT JOIN v_reviews_by_order AS r ON r.order_id = o.order_id
WHERE o.order_status = 'delivered'
  AND o.order_delivered_customer_date IS NOT NULL
  AND o.order_estimated_delivery_date IS NOT NULL
  AND o.order_purchase_timestamp IS NOT NULL;

-- Relación pedido-categoría sin duplicar un pedido que tenga varios productos de la misma categoría.
DROP VIEW IF EXISTS v_order_category;
CREATE VIEW v_order_category AS
SELECT DISTINCT
  i.order_id,
  COALESCE(NULLIF(t.product_category_name_english, ''), NULLIF(p.product_category_name, ''), 'unknown') AS category
FROM olist_order_items_dataset AS i
JOIN olist_products_dataset AS p ON p.product_id = i.product_id
LEFT JOIN product_category_name_translation AS t
  ON t.product_category_name = p.product_category_name;

DROP VIEW IF EXISTS v_order_category_outcomes;
CREATE VIEW v_order_category_outcomes AS
SELECT
  c.category,
  o.order_id,
  o.purchase_month,
  o.customer_state,
  o.delivery_days,
  o.days_late,
  o.late_flag,
  o.review_score,
  o.low_review_flag
FROM v_order_category AS c
JOIN v_order_delivery_review AS o ON o.order_id = c.order_id;

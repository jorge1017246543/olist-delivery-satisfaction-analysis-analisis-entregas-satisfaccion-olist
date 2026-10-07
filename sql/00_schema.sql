-- Tablas de staging. Los nombres y el orden de las columnas corresponden a los CSV de Olist.
CREATE TABLE IF NOT EXISTS olist_orders_dataset (
  order_id TEXT PRIMARY KEY,
  customer_id TEXT,
  order_status TEXT,
  order_purchase_timestamp TEXT,
  order_approved_at TEXT,
  order_delivered_carrier_date TEXT,
  order_delivered_customer_date TEXT,
  order_estimated_delivery_date TEXT
);

CREATE TABLE IF NOT EXISTS olist_order_reviews_dataset (
  review_id TEXT,
  order_id TEXT,
  review_score INTEGER,
  review_comment_title TEXT,
  review_comment_message TEXT,
  review_creation_date TEXT,
  review_answer_timestamp TEXT
);

CREATE TABLE IF NOT EXISTS olist_customers_dataset (
  customer_id TEXT PRIMARY KEY,
  customer_unique_id TEXT,
  customer_zip_code_prefix TEXT,
  customer_city TEXT,
  customer_state TEXT
);

CREATE TABLE IF NOT EXISTS olist_order_items_dataset (
  order_id TEXT,
  order_item_id INTEGER,
  product_id TEXT,
  seller_id TEXT,
  shipping_limit_date TEXT,
  price REAL,
  freight_value REAL
);

CREATE TABLE IF NOT EXISTS olist_products_dataset (
  product_id TEXT PRIMARY KEY,
  product_category_name TEXT,
  product_name_lenght INTEGER,
  product_description_lenght INTEGER,
  product_photos_qty INTEGER,
  product_weight_g REAL,
  product_length_cm REAL,
  product_height_cm REAL,
  product_width_cm REAL
);

CREATE TABLE IF NOT EXISTS product_category_name_translation (
  product_category_name TEXT,
  product_category_name_english TEXT
);

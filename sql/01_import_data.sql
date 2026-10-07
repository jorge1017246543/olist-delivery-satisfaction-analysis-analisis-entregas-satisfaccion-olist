-- Ejecutar desde la raíz del proyecto sobre una base recién creada.
-- Los CSV se descargan con scripts/download_dataset.mjs y se descomprimen en data/raw.
.bail on
.mode csv
.import --skip 1 data/raw/olist_orders_dataset.csv olist_orders_dataset
.import --skip 1 data/raw/olist_order_reviews_dataset.csv olist_order_reviews_dataset
.import --skip 1 data/raw/olist_customers_dataset.csv olist_customers_dataset
.import --skip 1 data/raw/olist_order_items_dataset.csv olist_order_items_dataset
.import --skip 1 data/raw/olist_products_dataset.csv olist_products_dataset
.import --skip 1 data/raw/product_category_name_translation.csv product_category_name_translation

-- NIMA COLLECTION: production performance indexes
-- Run this once against the live Neon database.
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX IF NOT EXISTS products_active_created_idx ON products(active,created_at DESC,id DESC);
CREATE INDEX IF NOT EXISTS products_active_stock_idx ON products(active,stock,updated_at DESC,id DESC);
CREATE INDEX IF NOT EXISTS products_name_trgm_idx ON products USING gin (lower(name) gin_trgm_ops);
CREATE INDEX IF NOT EXISTS products_category_trgm_idx ON products USING gin (lower(category) gin_trgm_ops);
CREATE INDEX IF NOT EXISTS orders_order_number_trgm_idx ON orders USING gin (lower(order_number) gin_trgm_ops);
CREATE INDEX IF NOT EXISTS orders_customer_name_trgm_idx ON orders USING gin (lower(customer_name) gin_trgm_ops);
CREATE INDEX IF NOT EXISTS orders_phone_trgm_idx ON orders USING gin (phone gin_trgm_ops);
CREATE INDEX IF NOT EXISTS orders_created_id_idx ON orders(created_at DESC,id DESC);

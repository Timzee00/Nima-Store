CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(120) NOT NULL, slug varchar(160) NOT NULL UNIQUE, category varchar(80) NOT NULL,
  description text NOT NULL, price numeric(12,2) NOT NULL CHECK (price>=0), sale_price numeric(12,2),
  stock integer NOT NULL DEFAULT 0 CHECK(stock>=0), images jsonb NOT NULL DEFAULT '[]'::jsonb,
  featured boolean NOT NULL DEFAULT false, active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS products_active_idx ON products(active);
CREATE INDEX IF NOT EXISTS products_category_idx ON products(category);
CREATE INDEX IF NOT EXISTS products_featured_idx ON products(featured);
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name varchar(120) NOT NULL, phone varchar(30) NOT NULL, delivery_address text NOT NULL, note text,
  subtotal numeric(12,2) NOT NULL CHECK(subtotal>=0), delivery_fee numeric(12,2) NOT NULL DEFAULT 0 CHECK(delivery_fee>=0),
  total numeric(12,2) NOT NULL CHECK(total>=0), status varchar(20) NOT NULL DEFAULT 'pending' CHECK(status IN('pending','confirmed','fulfilled','cancelled')),
  items jsonb NOT NULL DEFAULT '[]'::jsonb, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS orders_created_idx ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS orders_status_idx ON orders(status);
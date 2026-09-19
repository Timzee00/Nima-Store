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

CREATE TABLE IF NOT EXISTS customer_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token_hash char(64) UNIQUE NOT NULL,
  phone varchar(30) NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS customer_sessions_phone_idx ON customer_sessions(phone);
CREATE INDEX IF NOT EXISTS customer_sessions_expires_idx ON customer_sessions(expires_at);

ALTER TABLE orders ADD COLUMN IF NOT EXISTS order_number varchar(32);
UPDATE orders SET order_number='NIMA-'||upper(substr(replace(id::text,'-',''),1,12)) WHERE order_number IS NULL;
ALTER TABLE orders ALTER COLUMN order_number SET DEFAULT ('NIMA-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,12)));
CREATE UNIQUE INDEX IF NOT EXISTS orders_order_number_idx ON orders(order_number);
ALTER TABLE orders ALTER COLUMN order_number SET NOT NULL;

CREATE TABLE IF NOT EXISTS support_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_number varchar(24) UNIQUE NOT NULL DEFAULT ('NIMA-T-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,10))),
  order_id uuid NULL REFERENCES orders(id) ON DELETE SET NULL,
  customer_name varchar(120) NOT NULL,
  phone varchar(30) NOT NULL,
  category varchar(40) NOT NULL DEFAULT 'order_support',
  message text NOT NULL,
  status varchar(20) NOT NULL DEFAULT 'open' CHECK(status IN('open','in_progress','resolved','closed')),
  priority varchar(20) NOT NULL DEFAULT 'normal' CHECK(priority IN('low','normal','high','urgent')),
  staff_note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS support_tickets_order_idx ON support_tickets(order_id);
CREATE INDEX IF NOT EXISTS support_tickets_phone_idx ON support_tickets(phone);
CREATE INDEX IF NOT EXISTS support_tickets_status_idx ON support_tickets(status);

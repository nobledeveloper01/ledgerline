CREATE TABLE users (id serial PRIMARY KEY, email text NOT NULL UNIQUE);
CREATE TABLE orders (id serial PRIMARY KEY, user_id integer, total numeric(12,2), created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE invoices (id serial PRIMARY KEY, order_id integer NOT NULL REFERENCES orders (id), paid boolean NOT NULL DEFAULT false);
CREATE TABLE refunds (id serial PRIMARY KEY, invoice_id integer NOT NULL REFERENCES invoices (id), amount numeric(12,2));
CREATE TABLE comments (id bigserial PRIMARY KEY, owner_type text NOT NULL, owner_id bigint NOT NULL, body text);
CREATE TABLE posts (id bigserial PRIMARY KEY, title text);
CREATE TABLE photos (id bigserial PRIMARY KEY, url text);

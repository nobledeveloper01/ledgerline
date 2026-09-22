CREATE TABLE users (id serial PRIMARY KEY, email text NOT NULL UNIQUE);
CREATE TABLE orders (id serial PRIMARY KEY, user_id integer, total numeric(12,2));
CREATE TABLE invoices (id serial PRIMARY KEY, order_id integer NOT NULL REFERENCES orders (id));

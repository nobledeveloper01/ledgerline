CREATE TABLE orders (id bigserial PRIMARY KEY, user_id integer NOT NULL REFERENCES users (id), total numeric(12,2));

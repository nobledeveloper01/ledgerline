-- The monthly report: a join the schema never declared.
SELECT u.email, sum(o.total) FROM orders o JOIN users u ON u.id = o.user_id WHERE o.created_at > '2026-01-01' GROUP BY u.email;

-- Invoices per order: declared, and used.
SELECT o.id, count(i.id) FROM orders o LEFT JOIN invoices i ON i.order_id = o.id GROUP BY o.id;

-- The audit table exists only in the queries.
SELECT a.* FROM audit_log a JOIN orders o ON o.id = a.order_id WHERE a.actor = 'ada@example.com';

-- Comments on posts and photos: the polymorphic shape, twice.
SELECT c.* FROM comments c JOIN posts p ON c.owner_id = p.id WHERE c.owner_type = 'Post';
SELECT c.* FROM comments c JOIN photos p ON c.owner_id = p.id WHERE c.owner_type = 'Photo';

SELECT u.email, o.total FROM orders o JOIN users u ON u.id = o.user_id WHERE o.total > 100;
SELECT i.id FROM invoices i JOIN orders o ON o.id = i.order_id;

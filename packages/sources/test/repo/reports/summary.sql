-- Monthly summary. The join below has no constraint behind it.
SELECT u.email, sum(o.total)
FROM orders o
JOIN users u ON u.id = o.user_id
WHERE o.created_at > '2026-01-01'
GROUP BY u.email;

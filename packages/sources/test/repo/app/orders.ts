// The repository's own queries, as an ORM-less service writes them.
const byUser = `
  SELECT o.* FROM orders o
  JOIN users u ON u.id = o.user_id
  WHERE u.email = ${'$1'} AND o.total > 100`;
/* SELECT * FROM comments c JOIN users u ON u.id = c.user_id -- a query in a comment is not a query */
export const audit = "SELECT a.* FROM audit_log a JOIN orders o ON o.id = a.order_id WHERE a.actor = 'ada@example.com'";
const notSql = 'hello world';

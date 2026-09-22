# Django-style raw SQL with psycopg placeholders.
FEED = """
SELECT c.* FROM comments c
JOIN posts p ON c.owner_id = p.id
WHERE c.owner_type = 'Post' AND c.created_at > %(since)s
"""

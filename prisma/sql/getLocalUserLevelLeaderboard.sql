SELECT u.id, u.level
FROM users u
WHERE u.id = ANY($1)
ORDER BY u.level DESC
LIMIT 10
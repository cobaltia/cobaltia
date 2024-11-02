SELECT u.id, u.wallet
FROM users u
WHERE u.id = ANY($1)
ORDER BY u.wallet DESC
LIMIT 10
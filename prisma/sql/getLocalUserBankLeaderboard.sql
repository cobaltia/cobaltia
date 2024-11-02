SELECT u.id, u.bank_balance
FROM users u
WHERE u.id = ANY($1)
ORDER BY u.bank_balance DESC
LIMIT 10
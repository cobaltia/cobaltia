SELECT u.id, SUM(COALESCE(u.wallet, 0) + COALESCE(u.bank_balance, 0)) AS net_worth
FROM users u
WHERE u.id = ANY($1)
GROUP BY u.id
ORDER BY net_worth DESC
LIMIT 10
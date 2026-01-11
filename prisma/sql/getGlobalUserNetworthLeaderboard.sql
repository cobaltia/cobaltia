SELECT u.id, SUM(COALESCE(u.wallet, 0) + COALESCE(u.bank_balance, 0)) AS net_worth
FROM users u
GROUP BY u.id
ORDER BY net_worth DESC
LIMIT $1
OFFSET $2;

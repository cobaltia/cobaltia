SELECT
SUM(u.wallet + u.bank_balance) AS total_money
FROM users u;

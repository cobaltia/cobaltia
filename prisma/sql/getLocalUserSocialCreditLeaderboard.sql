SELECT u.id, u.social_credit
FROM users u
WHERE u.id = ANY($1)
ORDER BY u.social_credit DESC
LIMIT 10
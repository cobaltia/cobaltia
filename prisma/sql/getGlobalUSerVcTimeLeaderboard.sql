SELECT v.user_id, SUM(duration) as total_duration
FROM voices v
GROUP BY v.user_id
ORDER BY total_duration DESC
LIMIT 10
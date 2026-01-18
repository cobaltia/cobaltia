SELECT v.user_id, v.guild_id, SUM(duration) as total_duration
FROM voices v
WHERE v.guild_id = $1 AND v.user_id IN
(SELECT v.user_id
FROM voices v
WHERE v.guild_id = $1)
GROUP BY v.user_id, v.guild_id
ORDER BY total_duration DESC
LIMIT $2
OFFSET $3;

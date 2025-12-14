SELECT i.item_id, i.quantity, i.user_id
FROM inventories i
WHERE i.item_id = $1 AND i.user_id = ANY($2)
GROUP BY i.user_id, i.item_id, i.quantity
ORDER BY i.quantity DESC
LIMIT 10

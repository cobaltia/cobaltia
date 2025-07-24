SELECT SUM(COALESCE($1, cobuck)) AS total_count
FROM inventories;

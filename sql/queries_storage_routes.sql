USE mandi_db;
-- Q1 RECURSIVE CTE: cheapest route between two mandis (change @src and @dst)
SET @src = 1, @dst = 5;
WITH RECURSIVE paths AS (
  SELECT t.destination_mandi_id AS dest_id, t.cost AS total_cost, t.distance AS total_dist, 1 AS hops,
         CAST(CONCAT(t.source_mandi_id, '>', t.destination_mandi_id) AS CHAR(200)) AS path
  FROM transports t WHERE t.source_mandi_id = @src
  UNION ALL
  SELECT t.destination_mandi_id, p.total_cost + t.cost, p.total_dist + t.distance, p.hops + 1, CONCAT(p.path, '>', t.destination_mandi_id)
    FROM paths p JOIN transports t ON t.source_mandi_id = p.dest_id
    WHERE p.hops < 6 AND FIND_IN_SET(t.destination_mandi_id, REPLACE(p.path, '>', ',')) = 0
)
SELECT path, hops, total_dist, total_cost FROM paths WHERE dest_id = @dst
ORDER BY total_cost, total_dist LIMIT 1;


-- Q2 JOIN: all roads with mandi names
SELECT sm.name AS source, dm.name AS destination, t.distance, t.cost
FROM transports t JOIN mandi sm ON sm.mandi_id = t.source_mandi_id JOIN mandi dm ON dm.mandi_id = t.destination_mandi_id
ORDER BY sm.name, dm.name;

-- Q3 View + filter: warehouses more than 30 percent full
SELECT * FROM warehouse_stock_summary WHERE utilization_pct > 30 ORDER BY utilization_pct DESC;


-- Q4 Correlated subquery: batches larger than the average batch of their own warehouse
SELECT b.warehouse_id, b.batch_no, b.quantity
FROM storage_batch b
WHERE b.quantity > (SELECT AVG(b2.quantity) FROM storage_batch b2 WHERE b2.warehouse_id = b.warehouse_id);

-- Q5 Nested IN subquery: crops stored in more than one warehouse
SELECT crop_name FROM crop
WHERE crop_id IN (SELECT crop_id FROM storage_batch GROUP BY crop_id HAVING COUNT(DISTINCT warehouse_id) > 1);

-- Q6 View: stock of each crop in each warehouse
SELECT * FROM crop_stock_by_warehouse ORDER BY qty_stored DESC;

-- Q7 Index proof: the composite index idx_sale_mandi_crop_date should appear in the key column
EXPLAIN SELECT * FROM sale WHERE mandi_id = 1 AND crop_id = 1 AND sale_date >= '2026-01-01';

-- Q8 Transaction demo: change, look, undo
START TRANSACTION;
UPDATE transports SET cost = cost + 100 WHERE source_mandi_id = 1 AND destination_mandi_id = 2;
SELECT * FROM transports WHERE source_mandi_id = 1 AND destination_mandi_id = 2;
ROLLBACK;
SELECT * FROM transports WHERE source_mandi_id = 1 AND destination_mandi_id = 2;

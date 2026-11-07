
USE mandi_db;

-- Q1 JOIN of four tables
SELECT s.sale_id, s.sale_date, f.name AS farmer, m.name AS mandi,
c.crop_name, s.quantity, s.price, s.quantity * s.price AS total
FROM sale s JOIN farmer f ON f.farmer_id = s.farmer_id JOIN mandi m ON
m.mandi_id = s.mandi_id JOIN crop c ON c.crop_id = s.crop_id
ORDER BY s.sale_date DESC LIMIT 20;


-- Q2 GROUP BY, HAVING, aggregates
SELECT f.name, COUNT(*) AS sales_count, SUM(s.quantity) AS total_qty,
ROUND(SUM(s.quantity * s.price), 2) AS revenue
FROM sale s JOIN farmer f ON f.farmer_id = s.farmer_id
GROUP BY f.farmer_id, f.name HAVING SUM(s.quantity * s.price) > 100000 ORDER
BY revenue DESC;


-- Q3 Nested (scalar) subquery: crops whose average sale price beats the overall average
SELECT c.crop_name, ROUND(AVG(s.price), 2) AS avg_price
FROM sale s JOIN crop c ON c.crop_id = s.crop_id
GROUP BY c.crop_id, c.crop_name HAVING AVG(s.price) > (SELECT AVG(price) FROM sale);


-- Q4 Correlated subquery: sales priced above the average for the same mandi and crop
SELECT s.sale_id, s.mandi_id, s.crop_id, s.price
FROM sale s
WHERE s.price > (SELECT AVG(s2.price) FROM sale s2 WHERE s2.mandi_id =
s.mandi_id AND s2.crop_id = s.crop_id);

-- Q5 NOT EXISTS: mandis that never sold Ragi
SELECT m.name FROM mandi m
WHERE NOT EXISTS (SELECT 1 FROM sale s JOIN crop c ON c.crop_id = s.crop_id
WHERE s.mandi_id = m.mandi_id AND c.crop_name = 'Ragi');


-- Q6 Window functions: 3-day moving average and daily change (Tomato at Kolar)
SELECT price_date, modal_price,
       ROUND(AVG(modal_price) OVER (ORDER BY price_date ROWS BETWEEN 2
PRECEDING AND CURRENT ROW), 2) AS moving_avg_3d,
       modal_price - LAG(modal_price) OVER (ORDER BY price_date) AS
day_change
FROM price_record WHERE mandi_id = 2 AND crop_id = 1 ORDER BY price_date;


-- Q7 CTE + LAG: price crashes of 15 percent or more in one day
WITH x AS (
  SELECT mandi_id, crop_id, price_date, modal_price,
         LAG(modal_price) OVER (PARTITION BY mandi_id, crop_id ORDER BY
price_date) AS prev_price
  FROM price_record)
SELECT m.name AS mandi, c.crop_name, x.price_date, x.prev_price,
x.modal_price,
       ROUND((x.modal_price - x.prev_price) / x.prev_price * 100, 1) AS
pct_change
FROM x JOIN mandi m ON m.mandi_id = x.mandi_id JOIN crop c ON c.crop_id =
x.crop_id
WHERE x.prev_price IS NOT NULL AND (x.modal_price - x.prev_price) /
x.prev_price * 100 <= -15
ORDER BY pct_change;


-- Q8 Latest price of a crop in every mandi, ranked (correlated MAX + RANK)
SELECT m.name, p.price_date, p.modal_price, RANK() OVER (ORDER BY
p.modal_price DESC) AS price_rank
FROM price_record p JOIN mandi m ON m.mandi_id = p.mandi_id
WHERE p.crop_id = 1 AND p.price_date = (SELECT MAX(p2.price_date) FROM
price_record p2 WHERE p2.mandi_id = p.mandi_id AND p2.crop_id = p.crop_id)
ORDER BY price_rank;


-- Q9 View
SELECT * FROM mandi_total_sales ORDER BY total_sales DESC;
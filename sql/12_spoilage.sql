USE mandi_db;

DELIMITER $$

DROP FUNCTION IF EXISTS fn_quality_factor$$
CREATE FUNCTION fn_quality_factor(p_days INT, p_shelf INT) RETURNS DECIMAL(6,4)
DETERMINISTIC NO SQL
BEGIN
  IF p_shelf IS NULL OR p_shelf <= 0 THEN RETURN 0; END IF;
  IF p_days <= p_shelf / 2 THEN RETURN 1; END IF;
  IF p_days >= p_shelf THEN RETURN 0; END IF;
  RETURN 1 - (p_days - p_shelf / 2) / (p_shelf / 2);
END$$

DROP PROCEDURE IF EXISTS my_batches$$
CREATE PROCEDURE my_batches(IN p_user INT)
BEGIN
  SELECT b.warehouse_id, b.batch_no, w.location AS warehouse,
         c.crop_id, c.crop_name AS crop, c.shelf_life_days,
         b.quantity, b.date_in, DATEDIFF(CURDATE(), b.date_in) AS days_stored
  FROM storage_batch b
  JOIN farmer f ON f.farmer_id = b.farmer_id
  JOIN warehouse w ON w.warehouse_id = b.warehouse_id
  JOIN crop c ON c.crop_id = b.crop_id
  WHERE f.user_id = p_user ORDER BY b.date_in;
END$$

DROP PROCEDURE IF EXISTS spoilage_projection$$
CREATE PROCEDURE spoilage_projection(
  IN p_crop INT, IN p_qty DECIMAL(12,2), IN p_days_stored INT
)
BEGIN
  DECLARE v_shelf INT;
  DECLARE v_now DECIMAL(12,4);
  DECLARE v_first DECIMAL(12,4);
  DECLARE v_now_date DATE;
  DECLARE v_first_date DATE;
  DECLARE v_slope DECIMAL(12,4) DEFAULT 0;
  DECLARE v_wait INT;

  SELECT shelf_life_days INTO v_shelf FROM crop WHERE crop_id = p_crop;
  IF v_shelf IS NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'No shelf life is set for this crop yet';
  END IF;
  IF p_qty IS NULL OR p_qty <= 0 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Quantity must be greater than zero';
  END IF;
  IF p_days_stored IS NULL OR p_days_stored < 0 THEN SET p_days_stored = 0; END IF;

  SELECT d.avgp, d.price_date INTO v_now, v_now_date
  FROM (
    SELECT price_date, AVG(modal_price) AS avgp
    FROM price_record
    WHERE crop_id = p_crop AND price_date >= DATE_SUB(CURDATE(), INTERVAL 14 DAY)
    GROUP BY price_date
  ) d ORDER BY d.price_date DESC LIMIT 1;
  SELECT d.avgp, d.price_date INTO v_first, v_first_date
  FROM (
    SELECT price_date, AVG(modal_price) AS avgp
    FROM price_record
    WHERE crop_id = p_crop AND price_date >= DATE_SUB(CURDATE(), INTERVAL 14 DAY)
    GROUP BY price_date
  ) d ORDER BY d.price_date ASC LIMIT 1;
  IF v_now IS NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'No recent prices for this crop';
  END IF;
  IF DATEDIFF(v_now_date, v_first_date) > 0 THEN
    SET v_slope = (v_now - v_first) / DATEDIFF(v_now_date, v_first_date);
    SET v_slope = LEAST(GREATEST(v_slope, -v_now * 0.05), v_now * 0.05);
  END IF;
  SET v_wait = GREATEST(LEAST(v_shelf - p_days_stored, 30), 0);

  WITH RECURSIVE waiting_days AS (
    SELECT 0 AS d
    UNION ALL
    SELECT d + 1 FROM waiting_days WHERE d < v_wait
  )
  SELECT d AS wait_days,
         DATE_ADD(CURDATE(), INTERVAL d DAY) AS sell_on,
         ROUND(fn_quality_factor(p_days_stored + d, v_shelf) * 100, 1) AS quality_pct,
         ROUND(GREATEST(v_now + v_slope * d, 0), 2) AS price_per_quintal,
         ROUND(p_qty * fn_quality_factor(p_days_stored + d, v_shelf)
           * GREATEST(v_now + v_slope * d, 0), 2) AS expected_value
  FROM waiting_days;
END$$

DELIMITER ;

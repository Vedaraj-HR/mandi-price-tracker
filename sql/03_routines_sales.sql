USE mandi_db;
DELIMITER $$

DROP FUNCTION IF EXISTS fn_net_return$$
CREATE FUNCTION fn_net_return(p_price DECIMAL(10,2), p_cost DECIMAL(10,2))
RETURNS DECIMAL(10,2) DETERMINISTIC NO SQL
BEGIN
  RETURN p_price - p_cost;
END$$

DROP PROCEDURE IF EXISTS record_sale$$
CREATE PROCEDURE record_sale(
  IN p_farmer INT, IN p_mandi INT, IN p_crop INT,
  IN p_qty DECIMAL(12,2), IN p_price DECIMAL(10,2), IN p_date DATE)
BEGIN
  DECLARE v_id INT;
  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    ROLLBACK;
    RESIGNAL;
  END;

  IF p_qty IS NULL OR p_qty <= 0 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Quantity must be greater than zero';
  END IF;
  IF p_price IS NULL OR p_price <= 0 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Price must be greater than zero';
  END IF;
  IF p_date IS NOT NULL AND p_date > CURDATE() THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Sale date cannot be in the future';
  END IF;

  START TRANSACTION;
  IF NOT EXISTS (SELECT 1 FROM farmer WHERE farmer_id = p_farmer) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Farmer does not exist';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM mandi WHERE mandi_id = p_mandi) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Mandi does not exist';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM crop WHERE crop_id = p_crop) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Crop does not exist';
  END IF;

  INSERT INTO sale (farmer_id, mandi_id, crop_id, quantity, price, sale_date)
  VALUES (p_farmer, p_mandi, p_crop, p_qty, p_price, COALESCE(p_date, CURDATE()));
  SET v_id = LAST_INSERT_ID();
  COMMIT;
  SELECT v_id AS sale_id;
END$$

DROP TRIGGER IF EXISTS trg_mandi_manager_ins$$
CREATE TRIGGER trg_mandi_manager_ins BEFORE INSERT ON mandi FOR EACH ROW
BEGIN
  IF NOT EXISTS (SELECT 1 FROM users WHERE user_id = NEW.managed_by) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'A mandi must be managed by an existing user';
  END IF;
END$$

DROP TRIGGER IF EXISTS trg_mandi_manager_upd$$
CREATE TRIGGER trg_mandi_manager_upd BEFORE UPDATE ON mandi FOR EACH ROW
BEGIN
  IF NOT EXISTS (SELECT 1 FROM users WHERE user_id = NEW.managed_by) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'A mandi must be managed by an existing user';
  END IF;
END$$

DELIMITER ;
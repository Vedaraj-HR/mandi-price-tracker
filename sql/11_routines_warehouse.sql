USE mandi_db;

DELIMITER $$

DROP FUNCTION IF EXISTS fn_user_warehouse$$
CREATE FUNCTION fn_user_warehouse(p_user INT) RETURNS INT READS SQL DATA
BEGIN
  DECLARE v INT;
  SELECT warehouse_id INTO v
  FROM users
  WHERE user_id = p_user
    AND role IN ('WarehouseAdmin', 'WarehouseStaff');
  RETURN v;
END$$

DROP PROCEDURE IF EXISTS add_storage_batch$$
CREATE PROCEDURE add_storage_batch(
  IN p_user INT, IN p_farmer INT, IN p_crop INT,
  IN p_qty DECIMAL(12,2), IN p_date DATE
)
BEGIN
  DECLARE v_wh INT;
  DECLARE v_next INT;
  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    ROLLBACK;
    RESIGNAL;
  END;
  SET v_wh = fn_user_warehouse(p_user);
  IF v_wh IS NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Your account is not linked to a warehouse';
  END IF;
  IF p_qty IS NULL OR p_qty <= 0 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Quantity must be greater than zero';
  END IF;
  IF p_farmer IS NOT NULL AND NOT EXISTS (SELECT 1 FROM farmer WHERE farmer_id = p_farmer) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Farmer does not exist';
  END IF;
  START TRANSACTION;
  SELECT COALESCE(MAX(batch_no), 0) + 1 INTO v_next
  FROM storage_batch
  WHERE warehouse_id = v_wh
  FOR UPDATE;
  INSERT INTO storage_batch (warehouse_id, batch_no, farmer_id, crop_id, quantity, date_in)
  VALUES (v_wh, v_next, p_farmer, p_crop, p_qty, COALESCE(p_date, CURDATE()));
  COMMIT;
  SELECT v_next AS batch_no;
END$$

DROP PROCEDURE IF EXISTS update_storage_batch$$
CREATE PROCEDURE update_storage_batch(
  IN p_user INT, IN p_batch INT, IN p_farmer INT, IN p_crop INT,
  IN p_qty DECIMAL(12,2), IN p_date DATE
)
BEGIN
  DECLARE v_wh INT;
  SET v_wh = fn_user_warehouse(p_user);
  IF v_wh IS NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Your account is not linked to a warehouse';
  END IF;
  IF p_qty IS NULL OR p_qty <= 0 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Quantity must be greater than zero';
  END IF;
  IF p_farmer IS NOT NULL AND NOT EXISTS (SELECT 1 FROM farmer WHERE farmer_id = p_farmer) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Farmer does not exist';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM storage_batch WHERE warehouse_id = v_wh AND batch_no = p_batch) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Batch not found in your warehouse';
  END IF;
  UPDATE storage_batch
  SET farmer_id = p_farmer, crop_id = p_crop, quantity = p_qty,
      date_in = COALESCE(p_date, date_in)
  WHERE warehouse_id = v_wh AND batch_no = p_batch;
END$$

DROP PROCEDURE IF EXISTS delete_storage_batch$$
CREATE PROCEDURE delete_storage_batch(IN p_user INT, IN p_batch INT)
BEGIN
  DECLARE v_wh INT;
  SET v_wh = fn_user_warehouse(p_user);
  IF v_wh IS NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Your account is not linked to a warehouse';
  END IF;
  DELETE FROM storage_batch WHERE warehouse_id = v_wh AND batch_no = p_batch;
  IF ROW_COUNT() = 0 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Batch not found in your warehouse';
  END IF;
END$$

DROP PROCEDURE IF EXISTS list_batches$$
CREATE PROCEDURE list_batches(IN p_user INT, IN p_q VARCHAR(100))
BEGIN
  DECLARE v_wh INT;
  DECLARE v_like VARCHAR(110);
  SET v_wh = fn_user_warehouse(p_user);
  IF v_wh IS NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Your account is not linked to a warehouse';
  END IF;
  SET v_like = CONCAT('%', COALESCE(p_q, ''), '%');
  SELECT b.batch_no AS id, b.batch_no, b.farmer_id, f.name AS farmer,
         b.crop_id, c.crop_name AS crop, b.quantity, b.date_in
  FROM storage_batch b
  JOIN crop c ON c.crop_id = b.crop_id
  LEFT JOIN farmer f ON f.farmer_id = b.farmer_id
  WHERE b.warehouse_id = v_wh
    AND (c.crop_name LIKE v_like OR COALESCE(f.name, '') LIKE v_like)
  ORDER BY b.date_in DESC, b.batch_no DESC LIMIT 500;
END$$

DROP PROCEDURE IF EXISTS warehouse_home$$
CREATE PROCEDURE warehouse_home(IN p_user INT)
BEGIN
  DECLARE v_wh INT;
  SET v_wh = fn_user_warehouse(p_user);
  IF v_wh IS NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Your account is not linked to a warehouse';
  END IF;
  SELECT w.warehouse_id, w.location, w.capacity,
         COALESCE(SUM(b.quantity), 0) AS batch_total,
         ROUND(COALESCE(SUM(b.quantity), 0) / w.capacity * 100, 1) AS utilization_pct,
         COUNT(b.batch_no) AS batches
  FROM warehouse w
  LEFT JOIN storage_batch b ON b.warehouse_id = w.warehouse_id
  WHERE w.warehouse_id = v_wh
  GROUP BY w.warehouse_id, w.location, w.capacity;
END$$

DROP PROCEDURE IF EXISTS warehouse_stock$$
CREATE PROCEDURE warehouse_stock(IN p_user INT)
BEGIN
  DECLARE v_wh INT;
  SET v_wh = fn_user_warehouse(p_user);
  IF v_wh IS NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Your account is not linked to a warehouse';
  END IF;
  SELECT c.crop_name AS crop, SUM(b.quantity) AS qty_stored, COUNT(*) AS batches
  FROM storage_batch b JOIN crop c ON c.crop_id = b.crop_id
  WHERE b.warehouse_id = v_wh
  GROUP BY c.crop_id, c.crop_name ORDER BY c.crop_name;
END$$

DROP PROCEDURE IF EXISTS update_my_warehouse$$
CREATE PROCEDURE update_my_warehouse(
  IN p_user INT, IN p_location VARCHAR(150), IN p_capacity DECIMAL(12,2)
)
BEGIN
  DECLARE v_wh INT;
  DECLARE v_role VARCHAR(20);
  DECLARE v_used DECIMAL(12,2);
  SELECT warehouse_id, role INTO v_wh, v_role FROM users WHERE user_id = p_user;
  IF v_role IS NULL OR v_role <> 'WarehouseAdmin' OR v_wh IS NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Only a warehouse admin can change the warehouse';
  END IF;
  IF p_capacity IS NULL OR p_capacity <= 0 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Capacity must be greater than zero';
  END IF;
  SELECT COALESCE(SUM(quantity), 0) INTO v_used FROM storage_batch WHERE warehouse_id = v_wh;
  IF p_capacity < v_used THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Capacity cannot be less than the quantity already stored';
  END IF;
  UPDATE warehouse SET location = p_location, capacity = p_capacity WHERE warehouse_id = v_wh;
END$$

DROP PROCEDURE IF EXISTS create_staff$$
CREATE PROCEDURE create_staff(IN p_admin INT, IN p_username VARCHAR(50), IN p_hash VARCHAR(255))
BEGIN
  DECLARE v_role VARCHAR(20);
  DECLARE v_mandi INT;
  DECLARE v_wh INT;
  SELECT role, mandi_id, warehouse_id INTO v_role, v_mandi, v_wh FROM users WHERE user_id = p_admin;
  IF v_role = 'MandiAdmin' AND v_mandi IS NOT NULL THEN
    INSERT INTO users (username, password_hash, role, mandi_id)
    VALUES (p_username, p_hash, 'MandiStaff', v_mandi);
  ELSEIF v_role = 'WarehouseAdmin' AND v_wh IS NOT NULL THEN
    INSERT INTO users (username, password_hash, role, warehouse_id)
    VALUES (p_username, p_hash, 'WarehouseStaff', v_wh);
  ELSE
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Only a mandi admin or warehouse admin can create staff';
  END IF;
  SELECT LAST_INSERT_ID() AS user_id;
END$$

DROP PROCEDURE IF EXISTS list_staff$$
CREATE PROCEDURE list_staff(IN p_admin INT)
BEGIN
  DECLARE v_role VARCHAR(20);
  DECLARE v_mandi INT;
  DECLARE v_wh INT;
  SELECT role, mandi_id, warehouse_id INTO v_role, v_mandi, v_wh FROM users WHERE user_id = p_admin;
  IF v_role = 'MandiAdmin' AND v_mandi IS NOT NULL THEN
    SELECT user_id AS id, username, role FROM users
    WHERE role = 'MandiStaff' AND mandi_id = v_mandi ORDER BY username;
  ELSEIF v_role = 'WarehouseAdmin' AND v_wh IS NOT NULL THEN
    SELECT user_id AS id, username, role FROM users
    WHERE role = 'WarehouseStaff' AND warehouse_id = v_wh ORDER BY username;
  ELSE
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Only a mandi admin or warehouse admin can list staff';
  END IF;
END$$

DROP PROCEDURE IF EXISTS delete_staff$$
CREATE PROCEDURE delete_staff(IN p_admin INT, IN p_staff INT)
BEGIN
  DECLARE v_role VARCHAR(20);
  DECLARE v_mandi INT;
  DECLARE v_wh INT;
  DECLARE v_n INT DEFAULT 0;
  SELECT role, mandi_id, warehouse_id INTO v_role, v_mandi, v_wh FROM users WHERE user_id = p_admin;
  IF v_role = 'MandiAdmin' AND v_mandi IS NOT NULL THEN
    DELETE FROM users WHERE user_id = p_staff AND role = 'MandiStaff' AND mandi_id = v_mandi;
    SET v_n = ROW_COUNT();
  ELSEIF v_role = 'WarehouseAdmin' AND v_wh IS NOT NULL THEN
    DELETE FROM users WHERE user_id = p_staff AND role = 'WarehouseStaff' AND warehouse_id = v_wh;
    SET v_n = ROW_COUNT();
  ELSE
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Only a mandi admin or warehouse admin can delete staff';
  END IF;
  IF v_n = 0 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Staff member not found in your organisation';
  END IF;
END$$

DELIMITER ;

USE mandi_db;
DELIMITER $$

DROP PROCEDURE IF EXISTS add_storage_batch$$
CREATE PROCEDURE add_storage_batch(
    IN p_wh INT, IN p_crop INT, IN p_qty DECIMAL(12,2), IN p_date DATE)
BEGIN
  DECLARE v_next INT;
  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
      ROLLBACK;
      RESIGNAL;
  END;

  START TRANSACTION;
  IF NOT EXISTS (SELECT 1 FROM warehouse WHERE warehouse_id = p_wh) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Warehouse does not exist';
  END IF;
  SELECT COALESCE(MAX(batch_no), 0) + 1 INTO v_next
  FROM storage_batch WHERE warehouse_id = p_wh FOR UPDATE;
  INSERT INTO storage_batch (warehouse_id, batch_no, crop_id, quantity, date_in)
  VALUES (p_wh, v_next, p_crop, p_qty, COALESCE(p_date, CURDATE()));
  COMMIT;
  SELECT v_next AS batch_no;
END$$


DROP TRIGGER IF EXISTS trg_batch_capacity_ins$$
CREATE TRIGGER trg_batch_capacity_ins BEFORE INSERT ON storage_batch FOR EACH ROW
BEGIN
  DECLARE v_cap DECIMAL(12,2);
  DECLARE v_used DECIMAL(12,2);
  SELECT capacity INTO v_cap FROM warehouse WHERE warehouse_id = NEW.warehouse_id;
  SELECT COALESCE(SUM(quantity), 0) INTO v_used FROM storage_batch WHERE warehouse_id = NEW.warehouse_id;
  IF v_cap IS NOT NULL AND v_used + NEW.quantity > v_cap THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Warehouse capacity exceeded';
  END IF;
END$$


DROP TRIGGER IF EXISTS trg_batch_capacity_upd$$
CREATE TRIGGER trg_batch_capacity_upd BEFORE UPDATE ON storage_batch FOR EACH ROW
BEGIN
  DECLARE v_cap DECIMAL(12,2);
  DECLARE v_used DECIMAL(12,2);
  SELECT capacity INTO v_cap FROM warehouse WHERE warehouse_id = NEW.warehouse_id;
  SELECT COALESCE(SUM(quantity), 0) INTO v_used FROM storage_batch
  WHERE warehouse_id = NEW.warehouse_id AND NOT (warehouse_id = OLD.warehouse_id AND batch_no = OLD.batch_no);
  IF v_cap IS NOT NULL AND v_used + NEW.quantity > v_cap THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Warehouse capacity exceeded';
  END IF;
END$$


DELIMITER ;

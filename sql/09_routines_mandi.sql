
USE mandi_db;

DELIMITER $$

DROP FUNCTION IF EXISTS fn_user_mandi$$
CREATE FUNCTION fn_user_mandi(p_user INT) RETURNS INT READS SQL DATA
BEGIN
    DECLARE v INT;
    SELECT mandi_id INTO v
    FROM users
    WHERE user_id = p_user
      AND role IN ('MandiAdmin', 'MandiStaff');
    RETURN v;
END$$

DROP PROCEDURE IF EXISTS record_sale$$
CREATE PROCEDURE record_sale(
    IN p_user INT,
    IN p_farmer INT,
    IN p_crop INT,
    IN p_qty DECIMAL(12,2),
    IN p_price DECIMAL(10,2),
    IN p_date DATE
)
BEGIN
    DECLARE v_mandi INT;
    DECLARE v_id INT;

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    SET v_mandi = fn_user_mandi(p_user);

    IF v_mandi IS NULL THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Your account is not linked to a mandi';
    END IF;

    IF p_qty IS NULL OR p_qty <= 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Quantity must be greater than zero';
    END IF;

    IF p_price IS NULL OR p_price <= 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Price must be greater than zero';
    END IF;

    IF p_date IS NOT NULL AND p_date > CURDATE() THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Sale date cannot be in the future';
    END IF;

    START TRANSACTION;

    IF NOT EXISTS (SELECT 1 FROM farmer WHERE farmer_id = p_farmer) THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Farmer does not exist';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM crop WHERE crop_id = p_crop) THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Crop does not exist';
    END IF;

    INSERT INTO sale
        (farmer_id, mandi_id, crop_id, quantity, price, sale_date)
    VALUES
        (p_farmer, v_mandi, p_crop, p_qty, p_price, COALESCE(p_date, CURDATE()));

    SET v_id = LAST_INSERT_ID();
    COMMIT;

    SELECT v_id AS sale_id;
END$$

DROP PROCEDURE IF EXISTS save_price$$
CREATE PROCEDURE save_price(
    IN p_user INT,
    IN p_crop INT,
    IN p_date DATE,
    IN p_min DECIMAL(10,2),
    IN p_max DECIMAL(10,2),
    IN p_modal DECIMAL(10,2)
)
BEGIN
    DECLARE v_mandi INT;

    SET v_mandi = fn_user_mandi(p_user);

    IF v_mandi IS NULL THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Your account is not linked to a mandi';
    END IF;

    IF p_date IS NOT NULL AND p_date > CURDATE() THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Price date cannot be in the future';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM crop WHERE crop_id = p_crop) THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Crop does not exist';
    END IF;

    INSERT INTO price_record
        (mandi_id, crop_id, price_date, min_price, max_price, modal_price, source)
    VALUES
        (v_mandi, p_crop, COALESCE(p_date, CURDATE()), p_min, p_max, p_modal, 'manual') AS new
    ON DUPLICATE KEY UPDATE
        min_price = new.min_price,
        max_price = new.max_price,
        modal_price = new.modal_price,
        source = 'manual';

    SELECT 'saved' AS result;
END$$

DROP PROCEDURE IF EXISTS list_sales$$
CREATE PROCEDURE list_sales(IN p_user INT, IN p_q VARCHAR(100))
BEGIN
    DECLARE v_mandi INT;
    DECLARE v_like VARCHAR(110);

    SET v_mandi = fn_user_mandi(p_user);

    IF v_mandi IS NULL THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Your account is not linked to a mandi';
    END IF;

    SET v_like = CONCAT('%', COALESCE(p_q, ''), '%');

    SELECT
        s.sale_id AS id,
        s.sale_date,
        f.name AS farmer,
        c.crop_name AS crop,
        s.quantity,
        s.price,
        ROUND(s.quantity * s.price, 2) AS total
    FROM sale s
    JOIN farmer f ON f.farmer_id = s.farmer_id
    JOIN crop c ON c.crop_id = s.crop_id
    WHERE s.mandi_id = v_mandi
      AND (f.name LIKE v_like OR c.crop_name LIKE v_like)
    ORDER BY s.sale_date DESC, s.sale_id DESC
    LIMIT 300;
END$$

DROP PROCEDURE IF EXISTS list_prices$$
CREATE PROCEDURE list_prices(IN p_user INT, IN p_q VARCHAR(100))
BEGIN
    DECLARE v_mandi INT;
    DECLARE v_like VARCHAR(110);

    SET v_mandi = fn_user_mandi(p_user);

    IF v_mandi IS NULL THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Your account is not linked to a mandi';
    END IF;

    SET v_like = CONCAT('%', COALESCE(p_q, ''), '%');

    SELECT
        CONCAT(p.crop_id, '_', p.price_date) AS id,
        p.crop_id,
        c.crop_name AS crop,
        p.price_date,
        p.min_price,
        p.modal_price,
        p.max_price,
        p.source
    FROM price_record p
    JOIN crop c ON c.crop_id = p.crop_id
    WHERE p.mandi_id = v_mandi
      AND c.crop_name LIKE v_like
    ORDER BY p.price_date DESC, c.crop_name
    LIMIT 300;
END$$

DROP PROCEDURE IF EXISTS delete_sale$$
CREATE PROCEDURE delete_sale(IN p_user INT, IN p_sale INT)
BEGIN
    DECLARE v_mandi INT;
    DECLARE v_role VARCHAR(20);

    SELECT mandi_id, role
    INTO v_mandi, v_role
    FROM users
    WHERE user_id = p_user;

    IF v_role IS NULL OR v_role <> 'MandiAdmin' OR v_mandi IS NULL THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Only a mandi admin can delete sales';
    END IF;

    DELETE FROM sale
    WHERE sale_id = p_sale AND mandi_id = v_mandi;

    IF ROW_COUNT() = 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Sale not found in your mandi';
    END IF;
END$$

DROP PROCEDURE IF EXISTS mandi_home$$
CREATE PROCEDURE mandi_home(IN p_user INT)
BEGIN
    DECLARE v_mandi INT;

    SET v_mandi = fn_user_mandi(p_user);

    IF v_mandi IS NULL THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Your account is not linked to a mandi';
    END IF;

    SELECT
        m.mandi_id,
        m.name,
        m.location,
        m.latitude,
        m.longitude,
        (SELECT COUNT(*) FROM sale WHERE mandi_id = m.mandi_id) AS sales_count,
        (SELECT COALESCE(SUM(quantity * price), 0)
         FROM sale WHERE mandi_id = m.mandi_id) AS total_sales,
        (SELECT COUNT(*) FROM price_record
         WHERE mandi_id = m.mandi_id) AS price_records
    FROM mandi m
    WHERE m.mandi_id = v_mandi;
END$$

DROP PROCEDURE IF EXISTS update_my_mandi$$
CREATE PROCEDURE update_my_mandi(
    IN p_user INT,
    IN p_name VARCHAR(100),
    IN p_location VARCHAR(150),
    IN p_lat DECIMAL(9,6),
    IN p_lng DECIMAL(9,6)
)
BEGIN
    DECLARE v_mandi INT;
    DECLARE v_role VARCHAR(20);

    SELECT mandi_id, role
    INTO v_mandi, v_role
    FROM users
    WHERE user_id = p_user;

    IF v_role IS NULL OR v_role <> 'MandiAdmin' OR v_mandi IS NULL THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Only a mandi admin can change the mandi';
    END IF;

    UPDATE mandi
    SET name = p_name,
        location = p_location,
        latitude = p_lat,
        longitude = p_lng
    WHERE mandi_id = v_mandi;

    SELECT v_mandi AS mandi_id;
END$$

DROP PROCEDURE IF EXISTS list_roads$$
CREATE PROCEDURE list_roads(IN p_user INT)
BEGIN
    DECLARE v_mandi INT;

    SET v_mandi = fn_user_mandi(p_user);

    IF v_mandi IS NULL THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Your account is not linked to a mandi';
    END IF;

    SELECT
        t.destination_mandi_id AS id,
        m.name AS destination,
        t.distance,
        t.cost,
        t.is_open
    FROM transports t
    JOIN mandi m ON m.mandi_id = t.destination_mandi_id
    WHERE t.source_mandi_id = v_mandi
    ORDER BY m.name;
END$$

DROP PROCEDURE IF EXISTS manage_road$$
CREATE PROCEDURE manage_road(
    IN p_user INT,
    IN p_dest INT,
    IN p_action VARCHAR(10),
    IN p_distance DECIMAL(8,2)
)
BEGIN
    DECLARE v_mandi INT;
    DECLARE v_role VARCHAR(20);

    SELECT mandi_id, role
    INTO v_mandi, v_role
    FROM users
    WHERE user_id = p_user;

    IF v_role IS NULL OR v_role <> 'MandiAdmin' OR v_mandi IS NULL THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Only a mandi admin can manage roads';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM transports
        WHERE source_mandi_id = v_mandi
          AND destination_mandi_id = p_dest
    ) THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'No such road leaves your mandi';
    END IF;

    IF p_action = 'close' THEN
        UPDATE transports
        SET is_open = 0
        WHERE source_mandi_id = v_mandi
          AND destination_mandi_id = p_dest;

    ELSEIF p_action = 'open' THEN
        UPDATE transports
        SET is_open = 1
        WHERE source_mandi_id = v_mandi
          AND destination_mandi_id = p_dest;

    ELSEIF p_action = 'distance' THEN
        IF p_distance IS NULL OR p_distance <= 0 THEN
            SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Distance must be greater than zero';
        END IF;

        UPDATE transports
        SET distance = p_distance,
            cost = ROUND(p_distance * 1.5)
        WHERE source_mandi_id = v_mandi
          AND destination_mandi_id = p_dest;

    ELSEIF p_action = 'delete' THEN
        DELETE FROM transports
        WHERE source_mandi_id = v_mandi
          AND destination_mandi_id = p_dest;

    ELSE
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Unknown road action';
    END IF;

    SELECT distance, is_open
    FROM transports
    WHERE source_mandi_id = v_mandi
      AND destination_mandi_id = p_dest;
END$$

DELIMITER ;

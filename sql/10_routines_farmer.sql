
USE mandi_db;

DELIMITER $$

DROP PROCEDURE IF EXISTS register_farmer$$
CREATE PROCEDURE register_farmer(
    IN p_username VARCHAR(50),
    IN p_hash VARCHAR(255),
    IN p_name VARCHAR(100),
    IN p_phone VARCHAR(15),
    IN p_place VARCHAR(150),
    IN p_lat DECIMAL(9,6),
    IN p_lng DECIMAL(9,6),
    IN p_near JSON
)
BEGIN
    DECLARE v_user INT;
    DECLARE v_farmer INT;

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    START TRANSACTION;

    INSERT INTO users (username, password_hash, role)
    VALUES (p_username, p_hash, 'Farmer');

    SET v_user = LAST_INSERT_ID();

    INSERT INTO farmer
        (name, phone, address, user_id, place, latitude, longitude)
    VALUES
        (p_name, p_phone, p_place, v_user, p_place, p_lat, p_lng);

    SET v_farmer = LAST_INSERT_ID();

    INSERT INTO farmer_near_mandi (farmer_id, mandi_id, distance)
    SELECT v_farmer, jt.mandi_id, jt.distance
    FROM JSON_TABLE(
        p_near,
        '$[*]' COLUMNS (
            mandi_id INT PATH '$.mandiId',
            distance DECIMAL(8,2) PATH '$.distance'
        )
    ) AS jt;

    COMMIT;

    SELECT v_farmer AS farmer_id, v_user AS user_id;
END$$

DROP PROCEDURE IF EXISTS my_profile$$
CREATE PROCEDURE my_profile(IN p_user INT)
BEGIN
    SELECT farmer_id, name, phone, place, latitude, longitude
    FROM farmer
    WHERE user_id = p_user;
END$$

DROP PROCEDURE IF EXISTS my_near$$
CREATE PROCEDURE my_near(IN p_user INT)
BEGIN
    SELECT n.mandi_id, n.distance
    FROM farmer_near_mandi n
    JOIN farmer f ON f.farmer_id = n.farmer_id
    WHERE f.user_id = p_user
    ORDER BY n.distance;
END$$

DROP PROCEDURE IF EXISTS update_my_profile$$
CREATE PROCEDURE update_my_profile(
    IN p_user INT,
    IN p_name VARCHAR(100),
    IN p_phone VARCHAR(15),
    IN p_place VARCHAR(150),
    IN p_lat DECIMAL(9,6),
    IN p_lng DECIMAL(9,6),
    IN p_near JSON
)
BEGIN
    DECLARE v_farmer INT;

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    SELECT farmer_id INTO v_farmer
    FROM farmer
    WHERE user_id = p_user;

    IF v_farmer IS NULL THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'No farmer profile for this account';
    END IF;

    START TRANSACTION;

    UPDATE farmer
    SET name = p_name,
        phone = p_phone,
        address = p_place,
        place = p_place,
        latitude = p_lat,
        longitude = p_lng
    WHERE farmer_id = v_farmer;

    DELETE FROM farmer_near_mandi
    WHERE farmer_id = v_farmer;

    INSERT INTO farmer_near_mandi (farmer_id, mandi_id, distance)
    SELECT v_farmer, jt.mandi_id, jt.distance
    FROM JSON_TABLE(
        p_near,
        '$[*]' COLUMNS (
            mandi_id INT PATH '$.mandiId',
            distance DECIMAL(8,2) PATH '$.distance'
        )
    ) AS jt;

    COMMIT;

    SELECT v_farmer AS farmer_id;
END$$

DROP PROCEDURE IF EXISTS my_sales$$
CREATE PROCEDURE my_sales(IN p_user INT)
BEGIN
    SELECT
        s.sale_id AS id,
        s.sale_date,
        m.name AS mandi,
        c.crop_name AS crop,
        s.quantity,
        s.price,
        ROUND(s.quantity * s.price, 2) AS total
    FROM sale s
    JOIN farmer f ON f.farmer_id = s.farmer_id
    JOIN mandi m ON m.mandi_id = s.mandi_id
    JOIN crop c ON c.crop_id = s.crop_id
    WHERE f.user_id = p_user
    ORDER BY s.sale_date DESC, s.sale_id DESC
    LIMIT 500;
END$$

DROP PROCEDURE IF EXISTS my_income$$
CREATE PROCEDURE my_income(
    IN p_user INT,
    IN p_from DATE,
    IN p_to DATE
)
BEGIN
    SELECT
        COALESCE(c.crop_name, 'TOTAL') AS crop,
        COUNT(*) AS sales_count,
        SUM(s.quantity) AS quintals,
        ROUND(SUM(s.quantity * s.price), 2) AS income,
        ROUND(SUM(s.quantity * s.price) / SUM(s.quantity), 2) AS avg_price
    FROM sale s
    JOIN farmer f ON f.farmer_id = s.farmer_id
    JOIN crop c ON c.crop_id = s.crop_id
    WHERE f.user_id = p_user
      AND s.sale_date BETWEEN p_from AND p_to
    GROUP BY c.crop_name WITH ROLLUP;
END$$

DROP PROCEDURE IF EXISTS delete_farmer$$
CREATE PROCEDURE delete_farmer(IN p_user INT, IN p_farmer INT)
BEGIN
    DECLARE v_login INT;

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    IF fn_user_mandi(p_user) IS NULL THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Only mandi staff can delete farmers';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM farmer WHERE farmer_id = p_farmer
    ) THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Farmer not found';
    END IF;

    START TRANSACTION;

    SELECT user_id INTO v_login
    FROM farmer
    WHERE farmer_id = p_farmer;

    DELETE FROM farmer
    WHERE farmer_id = p_farmer;

    IF v_login IS NOT NULL THEN
        DELETE FROM users
        WHERE user_id = v_login;
    END IF;

    COMMIT;
END$$

DELIMITER ;

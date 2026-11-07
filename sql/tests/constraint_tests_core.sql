
USE mandi_db;

INSERT INTO users (username, password_hash, role) VALUES ('hacker', 'x', 'Boss');
-- CHECK role

INSERT INTO users (username, password_hash, role) VALUES ('admin', 'x', 'Admin');
-- UNIQUE username

INSERT INTO farmer (name, phone) VALUES ('Test', '12345');
-- CHECK phone

INSERT INTO farmer (name, phone) VALUES (NULL, '9845012399');
-- NOT NULL

INSERT INTO crop (crop_name, category) VALUES ('Rice', 'Dry');
-- CHECK category

INSERT INTO crop (crop_name, category) VALUES ('Tomato', 'Perishable');
-- UNIQUE crop name

INSERT INTO mandi (name, location, managed_by) VALUES ('X', 'Y', 9999);
-- trigger message

INSERT INTO sale (farmer_id, mandi_id, crop_id, quantity, price) VALUES (1, 1, 1, 0, 100);
-- CHECK quantity

INSERT INTO sale (farmer_id, mandi_id, crop_id, quantity, price) VALUES (9999, 1, 1, 5, 100);
-- FOREIGN KEY

INSERT INTO price_record VALUES (1, 1, '2030-01-01', 200, 100, 150);
-- CHECK min <= modal <= max

DELETE FROM farmer WHERE farmer_id = (SELECT farmer_id FROM sale LIMIT 1);
-- RESTRICT

DELETE FROM users WHERE username = 'admin';
-- RESTRICT (manages mandis)

CALL record_sale(1, 1, 1, -5, 100, NULL);
-- procedure validation

CALL record_sale(1, 1, 1, 5, 100, '2099-01-01');
-- future date refused

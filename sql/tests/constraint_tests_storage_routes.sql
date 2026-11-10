-- sql/tests/constraint_tests_storage_routes.sql
-- EVERY line below MUST fail. Run them one at a time as root and screenshot each error.
USE mandi_db;
SELECT user_id INTO @WH_USER_ID FROM users WHERE username = 'wadmin1';
SELECT crop_id INTO @CROP_ID FROM crop LIMIT 1;
INSERT INTO warehouse (location, capacity) VALUES ('Test', 0);                                -- CHECK capacity
INSERT INTO storage_batch (warehouse_id, batch_no, crop_id, quantity) VALUES (1, 99, 1, -5);   -- CHECK quantity
INSERT INTO storage_batch (warehouse_id, batch_no, crop_id, quantity) VALUES (1, 98, 1, 999999); -- capacity TRIGGER
CALL add_storage_batch(@WH_USER_ID, NULL, @CROP_ID, 999999, NULL);                              -- capacity TRIGGER via scoped procedure
CALL add_storage_batch(1, NULL, @CROP_ID, 10, NULL);                                            -- user 1 is not a warehouse user
DELETE FROM crop WHERE crop_id = (SELECT crop_id FROM storage_batch LIMIT 1);                  -- RESTRICT (crop in storage)

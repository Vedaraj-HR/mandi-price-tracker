-- sql/tests/constraint_tests_storage_routes.sql
-- EVERY line below MUST fail. Run them one at a time as root and screenshot each error.
USE mandi_db;
INSERT INTO warehouse (location, capacity) VALUES ('Test', 0);                                -- CHECK capacity
INSERT INTO storage_batch (warehouse_id, batch_no, crop_id, quantity) VALUES (1, 99, 1, -5);   -- CHECK quantity
INSERT INTO storage_batch (warehouse_id, batch_no, crop_id, quantity) VALUES (1, 98, 1, 999999); -- capacity TRIGGER
CALL add_storage_batch(1, 1, 999999, NULL);                                                    -- capacity TRIGGER via procedure
INSERT INTO transports VALUES (1, 1, 10, 10);                                                  -- CHECK no self-loop
INSERT INTO transports VALUES (1, 2, -5, 10);                                                  -- CHECK distance
INSERT INTO transports VALUES (1, 2, 70, 105);                                                 -- PRIMARY KEY duplicate road
INSERT INTO transports VALUES (1, 999, 70, 105);                                               -- FOREIGN KEY
DELETE FROM crop WHERE crop_id = (SELECT crop_id FROM storage_batch LIMIT 1);                  -- RESTRICT (crop in storage)

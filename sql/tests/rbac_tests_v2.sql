-- Run each block in the matching Workbench connection after db:demo.
-- Connected as mandi_mstaff
USE mandi_db;
SELECT * FROM sale;                                         -- ERROR 1142
SELECT * FROM storage_batch;                                -- ERROR 1142
UPDATE crop SET category = 'Perishable' WHERE crop_id = 1; -- ERROR 1142
CALL mandi_db.add_storage_batch(1, NULL, 1, 10, NULL);      -- ERROR 1370
CALL mandi_db.delete_sale(1, 1);                            -- ERROR 1370
CALL mandi_db.record_sale(99999, 1, 1, 10, 100, NULL);      -- ERROR 1644
-- Connected as mandi_wstaff
SELECT * FROM price_record;                                 -- ERROR 1142
CALL mandi_db.record_sale(1, 1, 1, 10, 100, NULL);          -- ERROR 1370
SELECT crop_id, crop_name, shelf_life_days FROM crop;       -- works
-- Connected as mandi_wadmin
UPDATE crop SET crop_name = 'X' WHERE crop_id = 1;          -- ERROR 1143
UPDATE crop SET shelf_life_days = 9 WHERE crop_id = 1;      -- works
-- Connected as mandi_madmin
SELECT * FROM users;                                        -- ERROR 1142
CREATE TABLE t (id INT);                                    -- ERROR 1142
-- Connected as mandi_farmer
SELECT * FROM sale;                                         -- ERROR 1142
SELECT * FROM users;                                        -- ERROR 1142
DELETE FROM price_record WHERE crop_id = 1;                 -- ERROR 1142
SELECT COUNT(*) FROM price_record;                          -- works

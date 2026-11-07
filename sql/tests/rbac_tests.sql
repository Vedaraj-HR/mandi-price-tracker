-- sql/tests/rbac_tests.sql : proves roles are enforced INSIDE MySQL.
-- Run each block in the matching Workbench connection (mandi_staff / mandi_admin),
-- one line at a time, and screenshot each result or error.
-- Needs seed data (npm run db:seed).

-- ===== Connected as mandi_staff =====
USE mandi_db;
SELECT * FROM users;                                          -- ERROR 1143 (password_hash column denied)
SELECT user_id, username, role FROM users;                    -- works
DELETE FROM sale WHERE sale_id = 1;                           -- ERROR 1142 DELETE command denied
UPDATE crop SET category = 'Perishable' WHERE crop_id = 1;    -- ERROR 1142
INSERT INTO transports VALUES (1, 4, 10, 15);                 -- ERROR 1142
CREATE TABLE t (id INT);                                      -- ERROR 1142
CALL mandi_db.record_sale(1, 1, 1, 10, 2000, NULL);           -- works (through the procedure)


-- ===== Connected as mandi_admin =====
USE mandi_db;
SELECT password_hash FROM users;                              -- ERROR 1143
CREATE TABLE t (id INT);                                      -- ERROR 1142
DROP TABLE crop;                                              -- ERROR 1142
DELETE FROM sale WHERE sale_id = 1;                           -- works

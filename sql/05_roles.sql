-- sql/05_roles.sql
GRANT SELECT (user_id, username, password_hash, role) ON mandi_db.users TO 'mandi_auth'@'localhost';


-- STAFF: read everything except password hashes
GRANT SELECT (user_id, username, role) ON mandi_db.users TO 'mandi_staff'@'localhost';
GRANT SELECT ON mandi_db.farmer TO 'mandi_staff'@'localhost';
GRANT SELECT ON mandi_db.farmer_contact TO 'mandi_staff'@'localhost';
GRANT SELECT ON mandi_db.crop TO 'mandi_staff'@'localhost';
GRANT SELECT ON mandi_db.mandi TO 'mandi_staff'@'localhost';
GRANT SELECT ON mandi_db.sale TO 'mandi_staff'@'localhost';
GRANT SELECT ON mandi_db.price_record TO 'mandi_staff'@'localhost';
GRANT SELECT ON mandi_db.warehouse TO 'mandi_staff'@'localhost';
GRANT SELECT ON mandi_db.storage_batch TO 'mandi_staff'@'localhost';
GRANT SELECT ON mandi_db.transports TO 'mandi_staff'@'localhost';
GRANT SELECT ON mandi_db.mandi_total_sales TO 'mandi_staff'@'localhost';
GRANT SELECT ON mandi_db.warehouse_stock_summary TO 'mandi_staff'@'localhost';
GRANT SELECT ON mandi_db.crop_stock_by_warehouse TO 'mandi_staff'@'localhost';
-- STAFF: write only what the project description allows (no DELETE on sale,
-- no change to crop, mandi, routes, users)
GRANT INSERT, UPDATE, DELETE ON mandi_db.farmer TO 'mandi_staff'@'localhost';
GRANT INSERT, UPDATE, DELETE ON mandi_db.farmer_contact TO 'mandi_staff'@'localhost';
GRANT INSERT, UPDATE, DELETE ON mandi_db.storage_batch TO 'mandi_staff'@'localhost';
GRANT INSERT, UPDATE ON mandi_db.price_record TO 'mandi_staff'@'localhost';
GRANT EXECUTE ON PROCEDURE mandi_db.record_sale TO 'mandi_staff'@'localhost';
GRANT EXECUTE ON PROCEDURE mandi_db.add_storage_batch TO 'mandi_staff'@'localhost';
GRANT EXECUTE ON FUNCTION mandi_db.fn_net_return TO 'mandi_staff'@'localhost';


-- ADMIN: everything staff can do, plus crops, mandis, warehouses, users,
-- routes. No CREATE/DROP/ALTER.
GRANT SELECT (user_id, username, role) ON mandi_db.users TO 'mandi_admin'@'localhost';
GRANT INSERT, UPDATE, DELETE ON mandi_db.users TO 'mandi_admin'@'localhost';
GRANT SELECT, INSERT, UPDATE, DELETE ON mandi_db.farmer TO 'mandi_admin'@'localhost';
GRANT SELECT, INSERT, UPDATE, DELETE ON mandi_db.farmer_contact TO 'mandi_admin'@'localhost';
GRANT SELECT, INSERT, UPDATE, DELETE ON mandi_db.crop TO 'mandi_admin'@'localhost';
GRANT SELECT, INSERT, UPDATE, DELETE ON mandi_db.mandi TO 'mandi_admin'@'localhost';
GRANT SELECT, INSERT, UPDATE, DELETE ON mandi_db.sale TO 'mandi_admin'@'localhost';
GRANT SELECT, INSERT, UPDATE, DELETE ON mandi_db.price_record TO 'mandi_admin'@'localhost';
GRANT SELECT, INSERT, UPDATE, DELETE ON mandi_db.warehouse TO 'mandi_admin'@'localhost';
GRANT SELECT, INSERT, UPDATE, DELETE ON mandi_db.storage_batch TO 'mandi_admin'@'localhost';
GRANT SELECT, INSERT, UPDATE, DELETE ON mandi_db.transports TO 'mandi_admin'@'localhost';
GRANT SELECT ON mandi_db.mandi_total_sales TO 'mandi_admin'@'localhost';
GRANT SELECT ON mandi_db.warehouse_stock_summary TO 'mandi_admin'@'localhost';
GRANT SELECT ON mandi_db.crop_stock_by_warehouse TO 'mandi_admin'@'localhost';
GRANT EXECUTE ON PROCEDURE mandi_db.record_sale TO 'mandi_admin'@'localhost';
GRANT EXECUTE ON PROCEDURE mandi_db.add_storage_batch TO 'mandi_admin'@'localhost';
GRANT EXECUTE ON FUNCTION mandi_db.fn_net_return TO 'mandi_admin'@'localhost';

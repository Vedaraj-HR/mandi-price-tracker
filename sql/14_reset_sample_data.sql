
USE mandi_db;

SET SQL_SAFE_UPDATES = 0;

DELETE FROM sale;
DELETE FROM storage_batch;
DELETE FROM transports;
DELETE FROM farmer_near_mandi;
DELETE FROM price_record;
DELETE FROM warehouse;
DELETE FROM mandi;
DELETE FROM crop;

SET SQL_SAFE_UPDATES = 1;

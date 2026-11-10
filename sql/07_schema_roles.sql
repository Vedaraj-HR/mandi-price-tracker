USE mandi_db;

SET SQL_SAFE_UPDATES = 0;

ALTER TABLE users DROP CHECK ck_users_role;
ALTER TABLE users
  ADD COLUMN mandi_id INT NULL,
  ADD COLUMN warehouse_id INT NULL;

UPDATE users SET role = 'MandiAdmin' WHERE role = 'Admin';
UPDATE users SET role = 'MandiStaff' WHERE role = 'Staff';

ALTER TABLE users
  ADD CONSTRAINT ck_users_role
    CHECK (role IN ('Farmer', 'MandiAdmin', 'MandiStaff', 'WarehouseAdmin', 'WarehouseStaff')),
  ADD CONSTRAINT fk_users_mandi
    FOREIGN KEY (mandi_id) REFERENCES mandi (mandi_id) ON DELETE SET NULL,
  ADD CONSTRAINT fk_users_warehouse
    FOREIGN KEY (warehouse_id) REFERENCES warehouse (warehouse_id) ON DELETE SET NULL;

ALTER TABLE crop
  ADD COLUMN shelf_life_days INT NULL,
  ADD CONSTRAINT ck_crop_shelf
    CHECK (shelf_life_days IS NULL OR shelf_life_days > 0);

ALTER TABLE storage_batch
  ADD COLUMN farmer_id INT NULL,
  ADD CONSTRAINT fk_batch_farmer
    FOREIGN KEY (farmer_id) REFERENCES farmer (farmer_id) ON DELETE SET NULL;

CREATE INDEX idx_batch_farmer ON storage_batch (farmer_id);

SET SQL_SAFE_UPDATES = 1;

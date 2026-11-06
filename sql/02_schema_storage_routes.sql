USE mandi_db;

CREATE TABLE warehouse (
  warehouse_id INT           NOT NULL AUTO_INCREMENT,
  location     VARCHAR(150)  NOT NULL,
  capacity     DECIMAL(12,2) NOT NULL,
  CONSTRAINT pk_warehouse          PRIMARY KEY (warehouse_id),
  CONSTRAINT ck_warehouse_capacity CHECK (capacity > 0)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

CREATE TABLE storage_batch (
  warehouse_id INT           NOT NULL,
  batch_no     INT           NOT NULL,
  crop_id      INT           NOT NULL,
  quantity     DECIMAL(12,2) NOT NULL,
  date_in      DATE          NOT NULL DEFAULT (CURRENT_DATE),
  CONSTRAINT pk_storage_batch   PRIMARY KEY (warehouse_id, batch_no),
  CONSTRAINT fk_batch_warehouse FOREIGN KEY (warehouse_id) REFERENCES warehouse (warehouse_id) ON DELETE CASCADE,
  CONSTRAINT fk_batch_crop      FOREIGN KEY (crop_id)      REFERENCES crop (crop_id)           ON DELETE RESTRICT,
  CONSTRAINT ck_batch_quantity  CHECK (quantity > 0)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

CREATE TABLE transports (
  source_mandi_id      INT           NOT NULL,
  destination_mandi_id INT           NOT NULL,
  distance             DECIMAL(8,2)  NOT NULL,
  cost                 DECIMAL(10,2) NOT NULL,
  CONSTRAINT pk_transports       PRIMARY KEY (source_mandi_id, destination_mandi_id),
  CONSTRAINT fk_transport_source FOREIGN KEY (source_mandi_id)      REFERENCES mandi (mandi_id) ON DELETE CASCADE,
  CONSTRAINT fk_transport_dest   FOREIGN KEY (destination_mandi_id) REFERENCES mandi (mandi_id) ON DELETE CASCADE,
  CONSTRAINT ck_transport_dist   CHECK (distance > 0),
  CONSTRAINT ck_transport_cost   CHECK (cost >= 0),
  CONSTRAINT ck_transport_noloop CHECK (source_mandi_id <> destination_mandi_id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

CREATE INDEX idx_transports_dest ON transports (destination_mandi_id);
CREATE INDEX idx_batch_date_in   ON storage_batch (date_in);
CREATE INDEX idx_batch_crop      ON storage_batch (crop_id);

CREATE VIEW warehouse_stock_summary AS
SELECT w.warehouse_id, w.location, w.capacity,
       COALESCE(SUM(b.quantity), 0) AS batch_total,
       ROUND(COALESCE(SUM(b.quantity), 0) / w.capacity * 100, 1) AS utilization_pct
FROM warehouse w LEFT JOIN storage_batch b ON b.warehouse_id = w.warehouse_id
GROUP BY w.warehouse_id, w.location, w.capacity;

CREATE VIEW crop_stock_by_warehouse AS
SELECT w.warehouse_id, w.location, c.crop_id, c.crop_name, SUM(b.quantity) AS qty_stored
FROM storage_batch b
JOIN warehouse w ON w.warehouse_id = b.warehouse_id
JOIN crop c      ON c.crop_id = b.crop_id
GROUP BY w.warehouse_id, w.location, c.crop_id, c.crop_name;

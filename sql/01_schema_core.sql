USE mandi_db;
CREATE TABLE users (
  user_id       INT          NOT NULL AUTO_INCREMENT,        
  username      VARCHAR(50)  NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role          VARCHAR(20)  NOT NULL,
  CONSTRAINT pk_users          PRIMARY KEY (user_id),
  CONSTRAINT uq_users_username UNIQUE (username),
  CONSTRAINT ck_users_role     CHECK (role IN ('Admin', 'Staff'))
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;
CREATE TABLE farmer (
  farmer_id INT          NOT NULL AUTO_INCREMENT,
  name      VARCHAR(100) NOT NULL,
  phone     VARCHAR(15)  NOT NULL,
  address   VARCHAR(255) NULL,
  CONSTRAINT pk_farmer       PRIMARY KEY (farmer_id),
  CONSTRAINT ck_farmer_phone CHECK (phone REGEXP '^[0-9+]{10,15}$')
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;
CREATE TABLE farmer_contact (
  farmer_id      INT         NOT NULL,
  contact_number VARCHAR(15) NOT NULL,
  CONSTRAINT pk_farmer_contact PRIMARY KEY (farmer_id, contact_number),
  CONSTRAINT fk_contact_farmer FOREIGN KEY (farmer_id) REFERENCES farmer 
(farmer_id) ON DELETE CASCADE,
  CONSTRAINT ck_contact_number CHECK (contact_number REGEXP '^[0-9+]
{10,15}$')
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;
CREATE TABLE crop (
  crop_id   INT          NOT NULL AUTO_INCREMENT,
  crop_name VARCHAR(100) NOT NULL,
  category  VARCHAR(20)  NOT NULL,
  CONSTRAINT pk_crop          PRIMARY KEY (crop_id),
  CONSTRAINT uq_crop_name     UNIQUE (crop_name),
  CONSTRAINT ck_crop_category CHECK (category IN ('Perishable', 'Non
Perishable'))
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;
CREATE TABLE mandi (
  mandi_id   INT          NOT NULL AUTO_INCREMENT,
  name       VARCHAR(100) NOT NULL,
  location   VARCHAR(150) NOT NULL,
  managed_by INT          NOT NULL,
  CONSTRAINT pk_mandi            PRIMARY KEY (mandi_id),
  CONSTRAINT uq_mandi_name_place UNIQUE (name, location),
  CONSTRAINT fk_mandi_manager    FOREIGN KEY (managed_by) REFERENCES users 
(user_id) ON DELETE RESTRICT
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;
CREATE TABLE sale (
  sale_id   INT           NOT NULL AUTO_INCREMENT,
  farmer_id INT           NOT NULL,
  mandi_id  INT           NOT NULL,
  crop_id   INT           NOT NULL,
  quantity  DECIMAL(12,2) NOT NULL,
  price     DECIMAL(10,2) NOT NULL,
  sale_date DATE          NOT NULL DEFAULT (CURRENT_DATE),
  CONSTRAINT pk_sale        PRIMARY KEY (sale_id),
  CONSTRAINT fk_sale_farmer FOREIGN KEY (farmer_id) REFERENCES farmer 
(farmer_id) ON DELETE RESTRICT,
  CONSTRAINT fk_sale_mandi  FOREIGN KEY (mandi_id)  REFERENCES mandi 
(mandi_id)   ON DELETE RESTRICT,
  CONSTRAINT fk_sale_crop   FOREIGN KEY (crop_id)   REFERENCES crop (crop_id)   
ON DELETE RESTRICT,
  CONSTRAINT ck_sale_qty    CHECK (quantity > 0),
  CONSTRAINT ck_sale_price  CHECK (price > 0)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;
CREATE TABLE price_record (
  mandi_id    INT           NOT NULL,
  crop_id     INT           NOT NULL,
  price_date  DATE          NOT NULL,
  min_price   DECIMAL(10,2) NOT NULL,
  max_price   DECIMAL(10,2) NOT NULL,
  modal_price DECIMAL(10,2) NOT NULL,
  CONSTRAINT pk_price_record PRIMARY KEY (mandi_id, crop_id, price_date),
  CONSTRAINT fk_price_mandi  FOREIGN KEY (mandi_id) REFERENCES mandi 
(mandi_id) ON DELETE CASCADE,
  CONSTRAINT fk_price_crop   FOREIGN KEY (crop_id)  REFERENCES crop (crop_id)   
ON DELETE CASCADE,
  CONSTRAINT ck_price_min    CHECK (min_price > 0),
  CONSTRAINT ck_price_order  CHECK (min_price <= modal_price AND modal_price 
<= max_price)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;
CREATE INDEX idx_sale_mandi_crop_date ON sale (mandi_id, crop_id, sale_date);
CREATE INDEX idx_sale_farmer          ON sale (farmer_id);
CREATE INDEX idx_sale_date            ON sale (sale_date);
CREATE INDEX idx_price_crop_date      ON price_record (crop_id, price_date);
CREATE INDEX idx_farmer_name          ON farmer (name);
CREATE VIEW mandi_total_sales AS
SELECT m.mandi_id, m.name, COALESCE(SUM(s.quantity * s.price), 0) AS 
total_sales
FROM mandi m LEFT JOIN sale s ON s.mandi_id = m.mandi_id
GROUP BY m.mandi_id, m.name;
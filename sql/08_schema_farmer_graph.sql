
USE mandi_db;

-- Add the source of each mandi price record
ALTER TABLE price_record
    ADD COLUMN source VARCHAR(12) NOT NULL DEFAULT 'manual' AFTER modal_price,
    ADD CONSTRAINT ck_price_source
        CHECK (source IN ('agmarknet', 'sample', 'manual'));

-- Add geographical coordinates to mandis
ALTER TABLE mandi
    ADD COLUMN latitude DECIMAL(9,6) NULL,
    ADD COLUMN longitude DECIMAL(9,6) NULL,
    ADD CONSTRAINT ck_mandi_lat
        CHECK (latitude IS NULL OR latitude BETWEEN -90 AND 90),
    ADD CONSTRAINT ck_mandi_lng
        CHECK (longitude IS NULL OR longitude BETWEEN -180 AND 180);

-- Add login and location information to farmers
ALTER TABLE farmer
    ADD COLUMN user_id INT NULL,
    ADD COLUMN place VARCHAR(150) NULL,
    ADD COLUMN latitude DECIMAL(9,6) NULL,
    ADD COLUMN longitude DECIMAL(9,6) NULL,
    ADD CONSTRAINT uq_farmer_user UNIQUE (user_id),
    ADD CONSTRAINT fk_farmer_user
        FOREIGN KEY (user_id) REFERENCES users (user_id)
        ON DELETE SET NULL,
    ADD CONSTRAINT ck_farmer_lat
        CHECK (latitude IS NULL OR latitude BETWEEN -90 AND 90),
    ADD CONSTRAINT ck_farmer_lng
        CHECK (longitude IS NULL OR longitude BETWEEN -180 AND 180);

-- Track whether each road is open or closed
ALTER TABLE transports
    ADD COLUMN is_open TINYINT(1) NOT NULL DEFAULT 1,
    ADD CONSTRAINT ck_transport_open CHECK (is_open IN (0, 1));

-- Store the three nearest mandis for each farmer
CREATE TABLE farmer_near_mandi (
    farmer_id INT NOT NULL,
    mandi_id INT NOT NULL,
    distance DECIMAL(8,2) NOT NULL,

    CONSTRAINT pk_farmer_near
        PRIMARY KEY (farmer_id, mandi_id),

    CONSTRAINT fk_near_farmer
        FOREIGN KEY (farmer_id) REFERENCES farmer (farmer_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_near_mandi
        FOREIGN KEY (mandi_id) REFERENCES mandi (mandi_id)
        ON DELETE CASCADE,

    CONSTRAINT ck_near_distance CHECK (distance > 0)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

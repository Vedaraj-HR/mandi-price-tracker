
USE mandi_db;

CREATE TABLE tmp_demo (id INT PRIMARY KEY, note VARCHAR(50));

ALTER TABLE tmp_demo ADD COLUMN created_on DATE NULL;

ALTER TABLE tmp_demo MODIFY COLUMN note VARCHAR(120) NOT NULL DEFAULT 'none';

ALTER TABLE tmp_demo RENAME COLUMN note TO remark;

CREATE INDEX idx_tmp_remark ON tmp_demo (remark);

DROP INDEX idx_tmp_remark ON tmp_demo;

ALTER TABLE tmp_demo DROP COLUMN created_on;

DROP TABLE tmp_demo;


ALTER TABLE farmer ADD COLUMN village VARCHAR(100) NULL AFTER address;

ALTER TABLE farmer ADD CONSTRAINT ck_farmer_name_len CHECK (CHAR_LENGTH(name) >= 2);

SHOW CREATE TABLE farmer;

ALTER TABLE farmer DROP CHECK ck_farmer_name_len;

ALTER TABLE farmer DROP COLUMN village;

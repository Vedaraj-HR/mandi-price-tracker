
// scripts/seed-sales-real.mjs
// Creates 60 sample sales using real imported market prices.

import mysql from 'mysql2/promise';

const env = process.env;

const db = await mysql.createConnection({
  host: env.MYSQL_HOST,
  port: Number(env.MYSQL_PORT || 3306),
  user: 'root',
  password: env.MYSQL_ROOT_PASSWORD,
  database: env.MYSQL_DATABASE,
  decimalNumbers: true,
  dateStrings: true,
});

const [[{ n }]] = await db.query('SELECT COUNT(*) AS n FROM sale');

if (n > 0) {
  throw new Error('Sales already exist. Run sql/08_reset_sample_data.sql first.');
}

const [farmers] = await db.query('SELECT farmer_id FROM farmer');

const [latest] = await db.query(`
  SELECT p.mandi_id, p.crop_id, p.price_date, p.modal_price
  FROM price_record p
  WHERE p.source = 'agmarknet'
    AND p.price_date = (
      SELECT MAX(p2.price_date)
      FROM price_record p2
      WHERE p2.mandi_id = p.mandi_id
        AND p2.crop_id = p.crop_id
        AND p2.source = 'agmarknet'
    )
`);

if (!farmers.length || !latest.length) {
  throw new Error('Need farmers and imported real prices first (npm run data:import)');
}

let seed = 7;

const rand = () =>
  (seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296;

const sales = [];

for (let i = 0; i < 60; i++) {
  const p = latest[Math.floor(rand() * latest.length)];
  const f = farmers[Math.floor(rand() * farmers.length)].farmer_id;

  const price =
    Math.round(p.modal_price * (0.97 + rand() * 0.06) * 100) / 100;

  sales.push([
    f,
    p.mandi_id,
    p.crop_id,
    5 + Math.floor(rand() * 95),
    price,
    p.price_date,
  ]);
}

await db.query(
  'INSERT INTO sale (farmer_id, mandi_id, crop_id, quantity, price, sale_date) VALUES ?',
  [sales]
);

console.log(`Created ${sales.length} sample sales priced from real market prices`);

await db.end();

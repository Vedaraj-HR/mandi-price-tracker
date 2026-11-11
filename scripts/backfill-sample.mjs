
// scripts/backfill-sample.mjs
// Adds earlier sample price history without overwriting real records.

import mysql from 'mysql2/promise';

const env = process.env;
const days = Number(process.argv[2] ?? 29);

const db = await mysql.createConnection({
  host: env.MYSQL_HOST,
  port: Number(env.MYSQL_PORT || 3306),
  user: 'root',
  password: env.MYSQL_ROOT_PASSWORD,
  database: env.MYSQL_DATABASE,
  decimalNumbers: true,
  dateStrings: true,
});

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

if (!latest.length) {
  throw new Error('Import real prices first (npm run data:import)');
}

let seed = 21;

const rand = () =>
  (seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296;

const rows = [];

for (const p of latest) {
  let v = p.modal_price;

  for (let d = 1; d <= days; d++) {
    v = v * (1 + (rand() - 0.5) * 0.05);
    v = Math.min(
      Math.max(v, p.modal_price * 0.8),
      p.modal_price * 1.2
    );

    const date = new Date(
      Date.parse(`${p.price_date}T00:00:00Z`) - d * 86400000
    ).toISOString().slice(0, 10);

    const modal = Math.round(v);

    rows.push([
      p.mandi_id,
      p.crop_id,
      date,
      Math.round(modal * 0.93),
      Math.round(modal * 1.07),
      modal,
      'sample',
    ]);
  }
}

await db.query(
  `INSERT IGNORE INTO price_record
   (mandi_id, crop_id, price_date, min_price, max_price, modal_price, source)
   VALUES ?`,
  [rows]
);

console.log(`Added up to ${rows.length} earlier days marked sample`);

await db.end();

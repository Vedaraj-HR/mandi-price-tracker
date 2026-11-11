
// scripts/seed-storage-real.mjs
// Creates 4 warehouses and 3 storage batches per warehouse.

import mysql from 'mysql2/promise';

const env = process.env;

const db = await mysql.createConnection({
  host: env.MYSQL_HOST,
  port: Number(env.MYSQL_PORT || 3306),
  user: 'root',
  password: env.MYSQL_ROOT_PASSWORD,
  database: env.MYSQL_DATABASE,
});


const [towns] = await db.query(
  'SELECT DISTINCT location FROM mandi ORDER BY location LIMIT 4'
);

const [crops] = await db.query(
  'SELECT crop_id FROM crop ORDER BY crop_id'
);

if (!towns.length || !crops.length) {
  throw new Error(
    'Import the mandis and crops first (npm run data:import)'
  );
}

const caps = [5000, 3000, 8000, 2000];

const [existing] = await db.query(
  'SELECT warehouse_id, capacity FROM warehouse ORDER BY warehouse_id'
);

if (existing.length === 0) {
  await db.query(
    'INSERT INTO warehouse (location, capacity) VALUES ?',
    [towns.map((t, i) => [`${t.location} Warehouse`, caps[i]])]
  );
}

const [wh] = await db.query(
  'SELECT warehouse_id, capacity FROM warehouse ORDER BY warehouse_id'
);

let seed = 11;

const rand = () =>
  (seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296;

const batches = [];

wh.forEach((w, wi) => {
  for (let b = 1; b <= 3; b++) {
    const crop = crops[Math.floor(rand() * crops.length)].crop_id;
    const qty = Math.round(w.capacity * (0.08 + rand() * 0.15));
    const day = new Date(
      Date.now() - (wi * 3 + b) * 86400000
    ).toISOString().slice(0, 10);

    batches.push([w.warehouse_id, b, crop, qty, day]);
  }
});

await db.query(
  `INSERT INTO storage_batch
   (warehouse_id, batch_no, crop_id, quantity, date_in)
   VALUES ?`,
  [batches]
);

console.log(
  `Created ${wh.length} warehouses and ${batches.length} batches`
);

await db.end();

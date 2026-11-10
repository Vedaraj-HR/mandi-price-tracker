// Seed the four demonstration warehouses and twelve storage batches.
// Run after the core crop seed and warehouse schema have been applied.
import mysql from 'mysql2/promise';

const env = process.env;
const db = await mysql.createConnection({
  host: env.MYSQL_HOST,
  port: Number(env.MYSQL_PORT || 3306),
  user: 'root',
  password: env.MYSQL_ROOT_PASSWORD,
  database: env.MYSQL_DATABASE,
});

try {
  const [[{ count }]] = await db.query('SELECT COUNT(*) AS count FROM warehouse');
  if (Number(count) > 0) {
    console.log('Warehouses already seeded. Drop the database to reseed.');
    process.exitCode = 0;
  } else {
    await db.query('INSERT INTO warehouse (location, capacity) VALUES ?', [[
      ['Bengaluru Cold Store', 5000],
      ['Kolar Godown', 3000],
      ['Hubballi Warehouse', 8000],
      ['Mysuru Godown', 2000],
    ]]);

    const [warehouses] = await db.query('SELECT warehouse_id FROM warehouse ORDER BY warehouse_id');
    const [crops] = await db.query('SELECT crop_id, crop_name FROM crop');
    const cropId = Object.fromEntries(crops.map((crop) => [crop.crop_name.toLowerCase(), crop.crop_id]));

    // [warehouse index, batch number, crop, quantity in quintals]
    const batches = [
      [0, 1, 'Tomato', 1200], [0, 2, 'Onion', 900], [0, 3, 'Potato', 1500],
      [1, 1, 'Tomato', 800], [1, 2, 'Onion', 600], [1, 3, 'Banana', 500],
      [2, 1, 'Maize', 2500], [2, 2, 'Ragi', 1800], [2, 3, 'Onion', 1200],
      [3, 1, 'Banana', 700], [3, 2, 'Potato', 500], [3, 3, 'Tomato', 400],
    ];
    const missing = [...new Set(batches.map(([, , crop]) => crop.toLowerCase()).filter((crop) => !cropId[crop]))];
    if (missing.length) throw new Error(`Missing crops: ${missing.join(', ')}`);

    await db.query(
      'INSERT INTO storage_batch (warehouse_id, batch_no, crop_id, quantity, date_in) VALUES ?',
      [batches.map(([warehouse, batch, crop, quantity], index) => [
        warehouses[warehouse].warehouse_id,
        batch,
        cropId[crop.toLowerCase()],
        quantity,
        new Date(Date.now() - (index * 3 + 1) * 86400000).toISOString().slice(0, 10),
      ])],
    );
    console.log('Storage seed done: 4 warehouses and 12 batches');
  }
} finally {
  await db.end();
}

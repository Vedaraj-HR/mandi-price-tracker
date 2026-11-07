import mysql from 'mysql2/promise';


const env = process.env;
const db = await mysql.createConnection({
  host: env.MYSQL_HOST, port: Number(env.MYSQL_PORT || 3306),
  user: 'root', password: env.MYSQL_ROOT_PASSWORD, database: env.MYSQL_DATABASE,
});
const [[{ n }]] = await db.query('SELECT COUNT(*) AS n FROM warehouse');
if (n > 0) { console.log('Already seeded. Drop the database to reseed.'); process.exit(0); }

await db.query('INSERT INTO warehouse (location, capacity) VALUES ?', [[
  ['Bengaluru Cold Store', 5000], ['Kolar Godown', 3000], ['Hubballi Warehouse', 8000], ['Mysuru Godown', 2000],
]]);
const [wh] = await db.query('SELECT warehouse_id FROM warehouse ORDER BY warehouse_id');
const [crops] = await db.query('SELECT crop_id, crop_name FROM crop');
const cid = Object.fromEntries(crops.map((c) => [c.crop_name, c.crop_id]));


// [warehouse index, batch_no, crop, quantity in quintals]
const batches = [[0, 1, 'Tomato', 1200], [0, 2, 'Onion', 900], [0, 3, 'Potato', 1500], [1, 1, 'Tomato', 800], [1, 2, 'Onion', 600],
  [2, 1, 'Maize', 2500], [2, 2, 'Ragi', 1800], [2, 3, 'Onion', 1200], [3, 1, 'Banana', 700], [3, 2, 'Potato', 500]];


await db.query('INSERT INTO storage_batch (warehouse_id, batch_no, crop_id, quantity, date_in) VALUES ?', [
  batches.map(([w, b, c, q], i) => [wh[w].warehouse_id, b, cid[c], q, new Date(Date.now() - (i * 3 + 1) * 86400000).toISOString().slice(0, 10)]),
]);

// Roads (approximate km). Cost is Rs per quintal, about 1.5 per km. Each
// road is stored in both directions.
// Note Bengaluru to Davangere: the direct road (390) is dearer than going
// via Tumakuru (about 368): the cheapest-route demo.
const [mandis] = await db.query('SELECT mandi_id, name FROM mandi');
const id = Object.fromEntries(mandis.map((m) => [m.name, m.mandi_id]));
const roads = [['Yeshwanthpur APMC', 'Kolar APMC', 70], ['Yeshwanthpur APMC', 'Tumakuru APMC', 70], ['Yeshwanthpur APMC', 'Mysuru APMC', 145],
  ['Tumakuru APMC', 'Davangere APMC', 175], ['Davangere APMC', 'Hubballi APMC', 140], ['Kolar APMC', 'Tumakuru APMC', 130],
  ['Mysuru APMC', 'Tumakuru APMC', 160], ['Yeshwanthpur APMC', 'Davangere APMC', 260]];
const rows = roads.flatMap(([a, b, km]) => { const cost = Math.round(km * 1.5); return [[id[a], id[b], km, cost], [id[b], id[a], km, cost]]; });
await db.query('INSERT INTO transports (source_mandi_id, destination_mandi_id, distance, cost) VALUES ?', [rows]);
console.log('Storage and routes seed done: warehouses, batches, 16 directed roads');
await db.end();

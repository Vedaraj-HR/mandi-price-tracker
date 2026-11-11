
import mysql from 'mysql2/promise';
import { fetchAll } from './agmarknet-client.mjs';
import { STATE, MARKETS, CROPS } from './agmarknet-config.mjs';

const dry = process.argv.includes('--dry-run');

if (!MARKETS.length || !CROPS.length) {
  throw new Error(
    'Fill MARKETS and CROPS in scripts/agmarknet-config.mjs first'
  );
}

const wantMarket = new Map(
  MARKETS.map((m) => [m.market.toLowerCase(), m])
);

const wantCrop = new Map(
  CROPS.map((c) => [c.commodity.toLowerCase(), c])
);

// 1. Download one crop at a time
const rows = [];

for (const c of CROPS) {
  const got = await fetchAll(
    { state: STATE, commodity: c.commodity },
    5000
  );

  console.log(`${c.commodity}: ${got.length} records downloaded`);
  rows.push(...got);
}

// 2. Keep selected markets and validate records
let skipped = 0;
const groups = new Map();

for (const r of rows) {
  const mk = (r.market ?? '').toLowerCase();
  const cm = (r.commodity ?? '').toLowerCase();

  if (!wantMarket.has(mk) || !wantCrop.has(cm)) continue;

  const ok =
    r.date &&
    r.min > 0 &&
    r.max > 0 &&
    r.modal > 0 &&
    r.min <= r.modal &&
    r.modal <= r.max;

  if (!ok) {
    skipped++;
    continue;
  }

  const key = `${mk}|${cm}|${r.date}`;

  if (!groups.has(key)) {
    groups.set(key, {
      market: wantMarket.get(mk).market,
      commodity: wantCrop.get(cm).commodity,
      date: r.date,
      list: [],
    });
  }

  groups.get(key).list.push(r);
}

// 3. Combine varieties and grades into one daily price record
const prices = [...groups.values()].map((g) => ({
  market: g.market,
  commodity: g.commodity,
  date: g.date,
  min: Math.min(...g.list.map((x) => x.min)),
  max: Math.max(...g.list.map((x) => x.max)),
  modal:
    Math.round(
      (g.list.reduce((s, x) => s + x.modal, 0) / g.list.length) * 100
    ) / 100,
}));

console.log(
  `Valid price records: ${prices.length}. Invalid rows skipped: ${skipped}`
);

const days = [...new Set(prices.map((p) => p.date))].sort();
console.log(`Price dates: ${days.join(', ')}`);

const haveMarket = new Set(prices.map((p) => p.market));

for (const m of MARKETS) {
  if (!haveMarket.has(m.market)) {
    console.log(
      `WARNING: no prices found for market ${m.market}. Check the spelling or choose another market.`
    );
  }
}

// Dry run stops here. No database changes.
if (dry) {
  console.log('Dry run: nothing was written.');
  process.exit(0);
}

if (!prices.length) {
  throw new Error('Nothing to import');
}

// 4. Database writing section — do not run until we verify the schema
const env = process.env;

const db = await mysql.createConnection({
  host: env.MYSQL_HOST,
  port: Number(env.MYSQL_PORT || 3306),
  user: 'root',
  password: env.MYSQL_ROOT_PASSWORD,
  database: env.MYSQL_DATABASE,
});

const [users] = await db.query(
  'SELECT user_id FROM users ORDER BY user_id'
);

if (!users.length) {
  throw new Error('No users found. Run npm run db:seed first');
}

for (const c of CROPS) {
  await db.query(
    'INSERT IGNORE INTO crop (crop_name, category) VALUES (?, ?)',
    [c.commodity, c.category]
  );
}

let i = 0;

for (const m of MARKETS) {
  await db.query(
    'INSERT IGNORE INTO mandi (name, location, managed_by) VALUES (?, ?, ?)',
    [m.market, m.district, users[i++ % users.length].user_id]
  );
}

const [cropRows] = await db.query(
  'SELECT crop_id, crop_name FROM crop'
);

const [mandiRows] = await db.query(
  'SELECT mandi_id, name FROM mandi'
);

const cropId = new Map(
  cropRows.map((r) => [r.crop_name.toLowerCase(), r.crop_id])
);

const mandiId = new Map(
  mandiRows.map((r) => [r.name.toLowerCase(), r.mandi_id])
);

const data = prices.map((p) => [
  mandiId.get(p.market.toLowerCase()),
  cropId.get(p.commodity.toLowerCase()),
  p.date,
  p.min,
  p.max,
  p.modal,
  'agmarknet',
]);

await db.query(
  `INSERT INTO price_record
   (mandi_id, crop_id, price_date, min_price, max_price, modal_price, source)
   VALUES ? AS new
   ON DUPLICATE KEY UPDATE
   min_price = new.min_price,
   max_price = new.max_price,
   modal_price = new.modal_price,
   source = new.source`,
  [data]
);

console.log(
  `Imported ${data.length} real price records for ${MARKETS.length} markets and ${CROPS.length} crops.`
);

await db.end();

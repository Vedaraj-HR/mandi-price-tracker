
// scripts/set-mandi-coordinates.mjs : npm run db:coords
import mysql from 'mysql2/promise';
import { LOCATIONS } from './market-locations.mjs';
import { geocode } from '../lib/geo.mjs';

const env = process.env;

const db = await mysql.createConnection({
  host: env.MYSQL_HOST,
  port: Number(env.MYSQL_PORT || 3306),
  user: 'root',
  password: env.MYSQL_ROOT_PASSWORD,
  database: env.MYSQL_DATABASE,
});

const [mandis] = await db.query(
  'SELECT mandi_id, name, location FROM mandi ORDER BY mandi_id'
);

if (!mandis.length) {
  throw new Error('Import the mandis first (npm run data:import)');
}

let missing = 0;

for (const m of mandis) {
  let p = LOCATIONS[m.name] ?? null;

  if (!p) {
    p = await geocode(`${m.name}, ${m.location}, Karnataka`);
  }

  if (!p) {
    console.log(
      `MISSING coordinates for ${m.name}: add it to scripts/market-locations.mjs`
    );
    missing++;
    continue;
  }

  await db.query(
    'UPDATE mandi SET latitude = ?, longitude = ? WHERE mandi_id = ?',
    [p.lat, p.lng, m.mandi_id]
  );

  console.log(`${m.name}: ${p.lat}, ${p.lng}`);
}

console.log(
  missing
    ? `${missing} mandi(s) still need coordinates`
    : 'All mandis have coordinates.'
);

await db.end();

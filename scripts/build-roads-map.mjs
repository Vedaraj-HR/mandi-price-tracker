
// scripts/build-roads-map.mjs
// Builds roads connecting each mandi to its nearest mandis.

import mysql from 'mysql2/promise';
import { roadMatrixKm } from '../lib/geo.mjs';

const env = process.env;
const K = Number(process.argv[2] ?? 3);

const db = await mysql.createConnection({
  host: env.MYSQL_HOST,
  port: Number(env.MYSQL_PORT || 3306),
  user: 'root',
  password: env.MYSQL_ROOT_PASSWORD,
  database: env.MYSQL_DATABASE,
  decimalNumbers: true,
});

const [mandis] = await db.query(`
  SELECT mandi_id, name, latitude AS lat, longitude AS lng
  FROM mandi
  ORDER BY mandi_id
`);

if (mandis.length < 2) {
  throw new Error('Import the mandis first (npm run data:import)');
}

if (mandis.some((m) => m.lat === null || m.lng === null)) {
  throw new Error('Run npm run db:coords first');
}

const [[{ n }]] = await db.query(
  'SELECT COUNT(*) AS n FROM transports'
);

if (n > 0) {
  throw new Error(
    'Roads already exist. To rebuild only the roads run DELETE FROM transports; in Workbench first.'
  );
}

const { matrix, mapped } = await roadMatrixKm(
  mandis.map((m) => ({
    lat: Number(m.lat),
    lng: Number(m.lng),
  }))
);

console.log(
  mapped
    ? 'Distances come from the map service.'
    : 'WARNING: map service not used. Distances are straight line x 1.25 estimates.'
);

const pairs = new Map();

mandis.forEach((_, i) => {
  const near = mandis
    .map((__, j) => ({ j, d: matrix[i][j] }))
    .filter((x) => x.j !== i && x.d > 0)
    .sort((x, y) => x.d - y.d)
    .slice(0, K);

  for (const { j } of near) {
    pairs.set(
      [i, j].sort((a, b) => a - b).join('-'),
      [Math.min(i, j), Math.max(i, j)]
    );
  }
});

const rows = [];

for (const [a, b] of pairs.values()) {
  for (const [x, y] of [[a, b], [b, a]]) {
    const d = Math.max(1, Math.round(matrix[x][y] * 10) / 10);

    rows.push([
      mandis[x].mandi_id,
      mandis[y].mandi_id,
      d,
      Math.round(d * 1.5),
      1,
    ]);
  }
}

await db.query(
  `INSERT INTO transports
   (source_mandi_id, destination_mandi_id, distance, cost, is_open)
   VALUES ?`,
  [rows]
);

console.log(
  `Inserted ${rows.length} directed roads (${pairs.size} road pairs).`
);

const adj = new Map(mandis.map((_, i) => [i, []]));

for (const [a, b] of pairs.values()) {
  adj.get(a).push(b);
  adj.get(b).push(a);
}

const seen = new Set([0]);
const queue = [0];

while (queue.length) {
  const x = queue.shift();

  for (const y of adj.get(x)) {
    if (!seen.has(y)) {
      seen.add(y);
      queue.push(y);
    }
  }
}

console.log(
  seen.size === mandis.length
    ? 'All mandis are connected.'
    : `WARNING: only ${seen.size} of ${mandis.length} mandis are connected. Run DELETE FROM transports; then npm run data:roads -- 4`
);

await db.end();

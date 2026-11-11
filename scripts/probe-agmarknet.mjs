
// scripts/probe-agmarknet.mjs
// Run using: npm run data:probe
// Optional state: npm run data:probe -- Tamil Nadu

import { fetchAll } from './agmarknet-client.mjs';

const state = process.argv.slice(2).join(' ') || 'Karnataka';

const rows = await fetchAll({ state }, 5000);

console.log(`Records for ${state}: ${rows.length}`);

const count = (list) =>
  list.reduce((m, k) => ((m[k] = (m[k] ?? 0) + 1), m), {});

const top = (obj, n) =>
  Object.entries(obj)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n);

console.log(
  'Distinct price dates in the feed: ' +
  Object.keys(count(rows.map((r) => r.date))).sort().join(', ')
);

console.log('\nTop markets (records | market | district):');

console.log(
  top(count(rows.map((r) => `${r.market} | ${r.district}`)), 25)
    .map(([k, v]) => `${v} ${k}`)
    .join('\n')
);

console.log('\nTop commodities (records | commodity):');

console.log(
  top(count(rows.map((r) => r.commodity)), 25)
    .map(([k, v]) => `${v} ${k}`)
    .join('\n')
);

const bad = rows.filter(
  (r) =>
    !(r.min > 0 &&
      r.max > 0 &&
      r.modal > 0 &&
      r.min <= r.modal &&
      r.modal <= r.max)
).length;

console.log(
  `\nRows with zero prices or breaking min <= modal <= max (the import skips these): ${bad}`
);

console.log('\nSample record:', rows[0]);

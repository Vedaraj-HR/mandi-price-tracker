
import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';

const env = process.env;
const db = await mysql.createConnection({
  host: env.MYSQL_HOST, port: Number(env.MYSQL_PORT || 3306),
  user: 'root', password: env.MYSQL_ROOT_PASSWORD, database: env.MYSQL_DATABASE,
});
const [[{ n }]] = await db.query('SELECT COUNT(*) AS n FROM users');
if (n > 0) { console.log('Already seeded. Drop the database to reseed.'); process.exit(0); }
if (!env.SEED_ADMIN_PASSWORD || !env.SEED_STAFF_PASSWORD) throw new Error('Set SEED_ADMIN_PASSWORD and SEED_STAFF_PASSWORD in .env.local');

let seed = 42;
const rand = () => (seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296;
const dayAgo = (n) => new Date(Date.now() - n * 86400000).toISOString().slice(0, 10);

await db.query('INSERT INTO users (username, password_hash, role) VALUES ?', [[
  ['admin', await bcrypt.hash(env.SEED_ADMIN_PASSWORD, 10), 'Admin'],
  ['staff1', await bcrypt.hash(env.SEED_STAFF_PASSWORD, 10), 'Staff'],
]]);
const [users] = await db.query('SELECT user_id, username FROM users');
const uid = Object.fromEntries(users.map((u) => [u.username, u.user_id]));

const cropList = [['Tomato', 'Perishable', 1800], ['Onion', 'Non-Perishable', 2200], ['Potato', 'Non-Perishable', 1900],
  ['Ragi', 'Non-Perishable', 3800], ['Maize', 'Non-Perishable', 2300], ['Banana', 'Perishable', 2600]];
await db.query('INSERT INTO crop (crop_name, category) VALUES ?', [cropList.map(([name, cat]) => [name, cat])]);
const [crops] = await db.query('SELECT crop_id, crop_name FROM crop ORDER BY crop_id');

const mandiList = [['Yeshwanthpur APMC', 'Bengaluru', 'admin'], ['Kolar APMC', 'Kolar', 'staff1'], ['Tumakuru APMC', 'Tumakuru', 'admin'],
  ['Mysuru APMC', 'Mysuru', 'staff1'], ['Davangere APMC', 'Davangere', 'admin'], ['Hubballi APMC', 'Hubballi', 'staff1']];
await db.query('INSERT INTO mandi (name, location, managed_by) VALUES ?', [mandiList.map(([n2, l, u]) => [n2, l, uid[u]])]);
const [mandis] = await db.query('SELECT mandi_id, name FROM mandi ORDER BY mandi_id');

const farmers = [['Ramesh Gowda', '9845012301', 'Kolar'], ['Lakshmi Devi', '9845012302', 'Tumakuru'], ['Basavaraj Patil', '9845012303', 'Hubballi'],
  ['Savitha Naik', '9845012304', 'Mysuru'], ['Manjunath R', '9845012305', 'Davangere'], ['Geetha Bai', '9845012306', 'Kolar'],
  ['Nagaraj S', '9845012307', 'Tumakuru'], ['Parvathi K', '9845012308', 'Bengaluru'], ['Shivanna', '9845012309', 'Mysuru'],
  ['Anitha M', '9845012310', 'Hubballi'], ['Venkatesh', '9845012311', 'Kolar'], ['Rukmini', '9845012312', 'Davangere']];
await db.query('INSERT INTO farmer (name, phone, address) VALUES ?', [farmers]);
const [fr] = await db.query('SELECT farmer_id FROM farmer ORDER BY farmer_id');
await db.query('INSERT INTO farmer_contact (farmer_id, contact_number) VALUES ?', [[
  [fr[0].farmer_id, '9980011001'], [fr[0].farmer_id, '9980011002'],
  [fr[2].farmer_id, '9980011003'], [fr[5].farmer_id, '9980011004'],
]]);

// 30 days of prices for every mandi and crop. Tomato at Kolar crashes by
// about 32 percent today (for the demo).
const prices = []; const modal = {};
mandis.forEach((m, mi) => crops.forEach((c, ci) => {
  const base = cropList[ci][2] * (0.92 + mi * 0.03 + rand() * 0.04);
  let prev = base;
  for (let d = 29; d >= 0; d--) {
    let p = Math.round(base * (1 + 0.1 * Math.sin((29 - d) / 5 + ci)) * (1 + (rand() - 0.5) * 0.04));
    if (c.crop_name === 'Tomato' && m.name === 'Kolar APMC' && d === 0) p = Math.round(prev * 0.68);
    prev = p;
    modal[`${mi}-${ci}-${d}`] = p;
    prices.push([m.mandi_id, c.crop_id, dayAgo(d), Math.round(p * 0.93), Math.round(p * 1.07), p]);
  }
}));
await db.query('INSERT INTO price_record (mandi_id, crop_id, price_date, min_price, max_price, modal_price) VALUES ?', [prices]);

const sales = [];
for (let i = 0; i < 60; i++) {
  const f = fr[Math.floor(rand() * fr.length)].farmer_id;
  const mi = Math.floor(rand() * mandis.length), ci = Math.floor(rand() * crops.length), d = Math.floor(rand() * 30);
  const price = Math.round(modal[`${mi}-${ci}-${d}`] * (0.97 + rand() * 0.06) * 100) / 100;
  sales.push([f, mandis[mi].mandi_id, crops[ci].crop_id, 5 + Math.floor(rand() * 95), price, dayAgo(d)]);
}
await db.query('INSERT INTO sale (farmer_id, mandi_id, crop_id, quantity, price, sale_date) VALUES ?', [sales]);
console.log('Core seed done: users, crops, mandis, farmers, prices, sales');
await db.end();

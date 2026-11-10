// scripts/setup-roles.mjs
import mysql from 'mysql2/promise';
import { readFileSync } from 'node:fs';

const env = process.env;
const accounts = [
  ['mandi_auth', env.MYSQL_AUTH_PASSWORD],
  ['mandi_farmer', env.MYSQL_FARMER_PASSWORD],
  ['mandi_madmin', env.MYSQL_MADMIN_PASSWORD],
  ['mandi_mstaff', env.MYSQL_MSTAFF_PASSWORD],
  ['mandi_wadmin', env.MYSQL_WADMIN_PASSWORD],
  ['mandi_wstaff', env.MYSQL_WSTAFF_PASSWORD],
];
for (const [user, pw] of accounts) if (!pw) throw new Error(`Set the password for ${user} in .env.local`);

const root = await mysql.createConnection({
  host: env.MYSQL_HOST, port: Number(env.MYSQL_PORT || 3306),
  user: 'root', password: env.MYSQL_ROOT_PASSWORD, multipleStatements: true,
});
const grants = readFileSync('sql/13_roles_v2.sql', 'utf8');


for (const host of ['localhost', '127.0.0.1']) {
  for (const [user, pw] of accounts) {
    await root.query('CREATE USER IF NOT EXISTS ?@? IDENTIFIED BY ?', [user, host, pw]);
    await root.query('ALTER USER ?@? IDENTIFIED BY ?', [user, host, pw]);
  }
  await root.query(grants.replaceAll(`'localhost'`, `'${host}'`));
  for (const old of ['mandi_staff', 'mandi_admin']) await root.query('DROP USER IF EXISTS ?@?', [old, host]);
}
await root.query('FLUSH PRIVILEGES');
console.log('Accounts ready: mandi_auth, mandi_farmer, mandi_madmin, mandi_mstaff, mandi_wadmin, mandi_wstaff');
await root.end();

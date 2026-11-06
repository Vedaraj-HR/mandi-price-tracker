// scripts/setup-roles.mjs
import mysql from 'mysql2/promise';
import { readFileSync } from 'node:fs';

const env = process.env;
const accounts = [
  ['mandi_auth', env.MYSQL_AUTH_PASSWORD],
  ['mandi_staff', env.MYSQL_STAFF_PASSWORD],
  ['mandi_admin', env.MYSQL_ADMIN_PASSWORD],
];
for (const [user, pw] of accounts) if (!pw) throw new Error(`Set the password for ${user} in .env.local`);

const root = await mysql.createConnection({
  host: env.MYSQL_HOST, port: Number(env.MYSQL_PORT || 3306),
  user: 'root', password: env.MYSQL_ROOT_PASSWORD, multipleStatements: true,
});
const grants = readFileSync('sql/05_roles.sql', 'utf8');


for (const host of ['localhost', '127.0.0.1']) {
  for (const [user, pw] of accounts) {
    await root.query('CREATE USER IF NOT EXISTS ?@? IDENTIFIED BY ?', [user, host, pw]);
    await root.query('ALTER USER ?@? IDENTIFIED BY ?', [user, host, pw]);
  }
  await root.query(grants.replaceAll(`'localhost'`, `'${host}'`));
}
await root.query('FLUSH PRIVILEGES');
console.log('Roles ready: mandi_auth, mandi_staff, mandi_admin');
await root.end();

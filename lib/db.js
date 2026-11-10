import mysql from 'mysql2/promise';

function make(user, password) {
  return mysql.createPool({
    host: process.env.MYSQL_HOST,
    port: Number(process.env.MYSQL_PORT || 3306),
    database: process.env.MYSQL_DATABASE,
    user,
    password,
    waitForConnections: true,
    connectionLimit: 5,
    dateStrings: true,
    decimalNumbers: true,
  });
}

const KEYS = {
  Farmer: 'FARMER', MandiAdmin: 'MADMIN', MandiStaff: 'MSTAFF',
  WarehouseAdmin: 'WADMIN', WarehouseStaff: 'WSTAFF', Auth: 'AUTH',
};

export function getPool(role) {
  const key = KEYS[role] ?? 'AUTH';
  globalThis.mandiPools ??= {};
  return (globalThis.mandiPools[key] ??= make(process.env[`MYSQL_${key}_USER`], process.env[`MYSQL_${key}_PASSWORD`]));
}

export async function withTransaction(role, fn) {
  const conn = await getPool(role).getConnection();
  try {
    await conn.beginTransaction();
    const out = await fn(conn);
    await conn.commit();
    return out;
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
}

// Create demo accounts, farmer locations and nearest-mandi data for local development.
import bcrypt from 'bcryptjs';
import mysql from 'mysql2/promise';

const password = process.env.SEED_DEMO_PASSWORD;
if (!password) throw new Error('Set SEED_DEMO_PASSWORD before running this script');

const env = process.env;
const db = await mysql.createConnection({
  host: env.MYSQL_HOST,
  port: Number(env.MYSQL_PORT || 3306),
  user: 'root',
  password: env.MYSQL_ROOT_PASSWORD,
  database: env.MYSQL_DATABASE,
  decimalNumbers: true,
});

const haversineKm = (lat1, lng1, lat2, lng2) => {
  const radians = (degrees) => (degrees * Math.PI) / 180;
  const dLat = radians(lat2 - lat1);
  const dLng = radians(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(radians(lat1)) * Math.cos(radians(lat2)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

try {
  const [mandis] = await db.query('SELECT mandi_id, name, latitude, longitude FROM mandi ORDER BY mandi_id');
  const [warehouses] = await db.query('SELECT warehouse_id, location FROM warehouse ORDER BY warehouse_id');
  const [farmers] = await db.query('SELECT farmer_id, name FROM farmer ORDER BY farmer_id LIMIT 3');
  if (!mandis.length || !warehouses.length || farmers.length < 3) {
    throw new Error('Seed mandis, warehouses and at least three farmers before the role demo');
  }
  if (mandis.some((mandi) => mandi.latitude == null || mandi.longitude == null)) {
    throw new Error('All mandis need latitude and longitude before running the role demo');
  }
  const [[existing]] = await db.query("SELECT user_id FROM users WHERE username = 'madmin1'");
  if (existing) throw new Error('Role demo accounts already exist; drop them before reseeding');

  const passwordHash = await bcrypt.hash(password, 10);
  const addUser = async (username, role, mandiId = null, warehouseId = null) => {
    const [result] = await db.query(
      'INSERT INTO users (username, password_hash, role, mandi_id, warehouse_id) VALUES (?, ?, ?, ?, ?)',
      [username, passwordHash, role, mandiId, warehouseId],
    );
    console.log(`created ${username} (${role})`);
    return result.insertId;
  };

  for (let index = 0; index < mandis.length; index += 1) {
    const mandi = mandis[index];
    const managerId = await addUser(`madmin${index + 1}`, 'MandiAdmin', mandi.mandi_id);
    await db.query('UPDATE mandi SET managed_by = ? WHERE mandi_id = ?', [managerId, mandi.mandi_id]);
    if (index < 3) await addUser(`mstaff${index + 1}`, 'MandiStaff', mandi.mandi_id);
  }
  for (let index = 0; index < warehouses.length; index += 1) {
    const warehouse = warehouses[index];
    await addUser(`wadmin${index + 1}`, 'WarehouseAdmin', null, warehouse.warehouse_id);
    if (index < 2) await addUser(`wstaff${index + 1}`, 'WarehouseStaff', null, warehouse.warehouse_id);
  }

  for (let index = 0; index < farmers.length; index += 1) {
    const farmer = farmers[index];
    const base = mandis[index % mandis.length];
    const latitude = Number(base.latitude) + 0.1 * (index + 1);
    const longitude = Number(base.longitude) - 0.1 * (index + 1);
    const userId = await addUser(`farmer${index + 1}`, 'Farmer');
    await db.query(
      'UPDATE farmer SET user_id = ?, place = ?, latitude = ?, longitude = ? WHERE farmer_id = ?',
      [userId, base.name, latitude, longitude, farmer.farmer_id],
    );

    const nearest = mandis
      .map((mandi) => ({ mandi, distance: haversineKm(latitude, longitude, mandi.latitude, mandi.longitude) * 1.25 }))
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 3);
    await db.query('DELETE FROM farmer_near_mandi WHERE farmer_id = ?', [farmer.farmer_id]);
    await db.query('INSERT INTO farmer_near_mandi (farmer_id, mandi_id, distance_km) VALUES ?', [
      nearest.map(({ mandi, distance }) => [farmer.farmer_id, mandi.mandi_id, Math.round(distance * 100) / 100]),
    ]);
  }

  const [batches] = await db.query('SELECT warehouse_id, batch_no FROM storage_batch ORDER BY warehouse_id, batch_no LIMIT 6');
  for (let index = 0; index < batches.length; index += 1) {
    await db.query(
      'UPDATE storage_batch SET farmer_id = ?, date_in = DATE_SUB(CURDATE(), INTERVAL ? DAY) WHERE warehouse_id = ? AND batch_no = ?',
      [farmers[index % farmers.length].farmer_id, 2 + index * 2, batches[index].warehouse_id, batches[index].batch_no],
    );
  }
  await db.query("DELETE FROM users WHERE username IN ('admin', 'staff1')");
  console.log('Role demo seed complete. Demo accounts use SEED_DEMO_PASSWORD.');
} finally {
  await db.end();
}

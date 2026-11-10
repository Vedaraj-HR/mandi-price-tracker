// Update crop shelf lives after the crop seed has been imported.
import mysql from 'mysql2/promise';

const SHELF = {
  tomato: 8, banana: 7, potato: 45, onion: 60, brinjal: 6, cabbage: 14, carrot: 14, beans: 5,
  ragi: 180, maize: 120, rice: 180, wheat: 180, jowar: 150, groundnut: 120, tur: 180, gram: 180,
};
const DEFAULT_DAYS = 30;
const env = process.env;
const db = await mysql.createConnection({
  host: env.MYSQL_HOST,
  port: Number(env.MYSQL_PORT || 3306),
  user: 'root',
  password: env.MYSQL_ROOT_PASSWORD,
  database: env.MYSQL_DATABASE,
});

try {
  const [crops] = await db.query('SELECT crop_id, crop_name FROM crop');
  if (!crops.length) throw new Error('Import the crops first (npm run data:import)');
  for (const crop of crops) {
    const key = crop.crop_name.toLowerCase();
    const days = SHELF[key] ?? DEFAULT_DAYS;
    await db.query('UPDATE crop SET shelf_life_days = ? WHERE crop_id = ?', [days, crop.crop_id]);
    console.log(`${crop.crop_name}: ${days} days${SHELF[key] ? '' : ' (default, please review)'}`);
  }
} finally {
  await db.end();
}

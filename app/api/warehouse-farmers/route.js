import { getPool } from '@/lib/db';
import { handler, WAREHOUSE } from '@/lib/guard';

export const GET = handler(WAREHOUSE, async (_req, _ctx, s) => {
  const [rows] = await getPool(s.role).query('SELECT farmer_id, name FROM farmer ORDER BY name LIMIT 1000');
  return Response.json(rows);
});

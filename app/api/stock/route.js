import { getPool } from '@/lib/db';
import { handler, WAREHOUSE } from '@/lib/guard';

export const GET = handler(WAREHOUSE, async (_req, _ctx, s) => {
  const pool = getPool(s.role);
  const [home] = await pool.query('CALL warehouse_home(?)', [s.uid]);
  const [byCrop] = await pool.query('CALL warehouse_stock(?)', [s.uid]);
  return Response.json({ summary: home[0][0] ?? null, byCrop: byCrop[0] });
});

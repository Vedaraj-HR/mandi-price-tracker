import { getPool } from '@/lib/db';
import { handler, ANY, MANDI, WAREHOUSE } from '@/lib/guard';

export const GET = handler(ANY, async (_req, _ctx, s) => {
  const pool = getPool(s.role);
  if (MANDI.includes(s.role)) {
    const [res] = await pool.query('CALL mandi_home(?)', [s.uid]);
    return Response.json({ kind: 'mandi', info: res[0][0] ?? null });
  }
  if (WAREHOUSE.includes(s.role)) {
    const [res] = await pool.query('CALL warehouse_home(?)', [s.uid]);
    return Response.json({ kind: 'warehouse', info: res[0][0] ?? null });
  }
  return Response.json({ kind: 'farmer', info: null });
});

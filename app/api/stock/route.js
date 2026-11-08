// app/api/stock/route.js : reads the two views
import { getPool } from '@/lib/db';
import { handler, ANY } from '@/lib/guard';

export const GET = handler(ANY, async (_req, _ctx, s) => {
  const pool = getPool(s.role);
  const [summary] = await pool.query('SELECT * FROM warehouse_stock_summary ORDER BY utilization_pct DESC');
  const [byCrop] = await pool.query('SELECT * FROM crop_stock_by_warehouse ORDER BY location, crop_name');
  return Response.json({ summary, byCrop });
});

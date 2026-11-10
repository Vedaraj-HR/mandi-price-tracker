import { getPool } from '@/lib/db';
import { handler, FARMER } from '@/lib/guard';
import { summarize } from '@/lib/spoilage';

export const GET = handler(FARMER, async (_req, _ctx, s) => {
  const pool = getPool(s.role);
  const [b] = await pool.query('CALL my_batches(?)', [s.uid]);
  const out = [];
  for (const batch of b[0]) {
    let summary = null;
    let error = null;
    try {
      const [p] = await pool.query('CALL spoilage_projection(?, ?, ?)',
        [batch.crop_id, batch.quantity, batch.days_stored]);
      summary = summarize(p[0], batch.days_stored, batch.shelf_life_days);
    } catch (e) {
      error = e.sqlMessage ?? 'Could not calculate';
    }
    out.push({ ...batch, summary, error });
  }
  return Response.json(out);
});

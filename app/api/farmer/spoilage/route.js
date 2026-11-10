import { getPool } from '@/lib/db';
import { handler, FARMER } from '@/lib/guard';
import { intParam } from '@/lib/validate';
import { HttpError } from '@/lib/errors';
import { summarize } from '@/lib/spoilage';

export const GET = handler(FARMER, async (req, _ctx, s) => {
  const sp = new URL(req.url).searchParams;
  const crop = intParam(sp, 'crop');
  const days = intParam(sp, 'days', false) ?? 0;
  const qty = Number(sp.get('qty'));
  if (!(qty > 0)) throw new HttpError(400, 'Quantity must be greater than zero');
  const pool = getPool(s.role);
  const [[c]] = await pool.query('SELECT shelf_life_days FROM crop WHERE crop_id = ?', [crop]);
  if (!c) throw new HttpError(404, 'Crop not found');
  const [p] = await pool.query('CALL spoilage_projection(?, ?, ?)', [crop, qty, days]);
  return Response.json(summarize(p[0], days, c.shelf_life_days));
});

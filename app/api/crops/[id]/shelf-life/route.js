import { getPool } from '@/lib/db';
import { handler, WAREHOUSE_ADMIN } from '@/lib/guard';
import { validate } from '@/lib/validate';
import { HttpError } from '@/lib/errors';

export const PUT = handler(WAREHOUSE_ADMIN, async (req, { params }, s) => {
  const { id } = await params;
  const d = validate(await req.json(), { shelf_life_days: { type: 'int', required: true, gt: 0 } });
  const [r] = await getPool(s.role).query('UPDATE crop SET shelf_life_days = ? WHERE crop_id = ?', [d.shelf_life_days, id]);
  if (!r.affectedRows) throw new HttpError(404, 'Crop not found');
  return Response.json({ ok: true });
});

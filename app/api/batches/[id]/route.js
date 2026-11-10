import { getPool } from '@/lib/db';
import { handler, WAREHOUSE } from '@/lib/guard';
import { validate } from '@/lib/validate';

export const PUT = handler(WAREHOUSE, async (req, { params }, s) => {
  const { id } = await params;
  const d = validate(await req.json(), {
    farmer_id: { type: 'int' }, crop_id: { type: 'int', required: true },
    quantity: { type: 'number', required: true, gt: 0 }, date_in: { type: 'date' },
  });
  await getPool(s.role).query('CALL update_storage_batch(?, ?, ?, ?, ?, ?)',
    [s.uid, id, d.farmer_id, d.crop_id, d.quantity, d.date_in]);
  return Response.json({ ok: true });
});
export const DELETE = handler(WAREHOUSE, async (_req, { params }, s) => {
  const { id } = await params;
  await getPool(s.role).query('CALL delete_storage_batch(?, ?)', [s.uid, id]);
  return Response.json({ ok: true });
});

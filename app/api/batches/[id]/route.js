// app/api/batches/[id]/route.js                (id looks like 3-2 = warehouse 3, batch 2)
import { getPool } from '@/lib/db';
import { handler, ANY } from '@/lib/guard';
import { validate } from '@/lib/validate';
import { HttpError } from '@/lib/errors';

function parseId(id) {
  const [w, b] = String(id).split('-').map(Number);
  if (!Number.isInteger(w) || !Number.isInteger(b)) throw new HttpError(400, 'Bad batch id');
  return { w, b };
}

export const PUT = handler(ANY, async (req, { params }, s) => {
  const { w, b } = parseId((await params).id);
  const d = validate(await req.json(), {
    crop_id: { type: 'int', required: true },
    quantity: { type: 'number', required: true, gt: 0 },
    date_in: { type: 'date' },
  });
  const [r] = await getPool(s.role).query(
    'UPDATE storage_batch SET crop_id = ?, quantity = ?, date_in = COALESCE(?, date_in) WHERE warehouse_id = ? AND batch_no = ?',
    [d.crop_id, d.quantity, d.date_in, w, b]);
  if (!r.affectedRows) throw new HttpError(404, 'Batch not found');
  return Response.json({ ok: true });
});


export const DELETE = handler(ANY, async (_req, { params }, s) => {
  const { w, b } = parseId((await params).id);
  const [r] = await getPool(s.role).query('DELETE FROM storage_batch WHERE warehouse_id = ? AND batch_no = ?', [w, b]);
  if (!r.affectedRows) throw new HttpError(404, 'Batch not found');
  return Response.json({ ok: true });
});

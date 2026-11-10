import { getPool } from '@/lib/db';
import { handler, WAREHOUSE } from '@/lib/guard';
import { validate } from '@/lib/validate';

export const GET = handler(WAREHOUSE, async (req, _ctx, s) => {
  const q = new URL(req.url).searchParams.get('q')?.trim() ?? '';
  const [res] = await getPool(s.role).query('CALL list_batches(?, ?)', [s.uid, q]);
  return Response.json(res[0]);
});
export const POST = handler(WAREHOUSE, async (req, _ctx, s) => {
  const d = validate(await req.json(), {
    farmer_id: { type: 'int' }, crop_id: { type: 'int', required: true },
    quantity: { type: 'number', required: true, gt: 0 }, date_in: { type: 'date' },
  });
  const [res] = await getPool(s.role).query('CALL add_storage_batch(?, ?, ?, ?, ?)',
    [s.uid, d.farmer_id, d.crop_id, d.quantity, d.date_in]);
  return Response.json({ batch_no: res[0][0].batch_no }, { status: 201 });
});

// app/api/batches/route.js
import { getPool } from '@/lib/db';
import { handler, ANY } from '@/lib/guard';
import { validate } from '@/lib/validate';

export const GET = handler(ANY, async (req, _ctx, s) => {
  const q = `%${new URL(req.url).searchParams.get('q')?.trim() ?? ''}%`;
  const [rows] = await getPool(s.role).query(
    `SELECT CONCAT(b.warehouse_id, '-', b.batch_no) AS id, b.warehouse_id, w.location AS warehouse, b.batch_no, b.crop_id,
            c.crop_name AS crop, b.quantity, b.date_in
     FROM storage_batch b JOIN warehouse w ON w.warehouse_id = b.warehouse_id JOIN crop c ON c.crop_id = b.crop_id
     WHERE w.location LIKE ? OR c.crop_name LIKE ? ORDER BY b.date_in DESC, b.warehouse_id, b.batch_no LIMIT 500`, [q, q]);
  return Response.json(rows);
});


export const POST = handler(ANY, async (req, _ctx, s) => {
  const d = validate(await req.json(), {
    warehouse_id: { type: 'int', required: true },
    crop_id: { type: 'int', required: true },
    quantity: { type: 'number', required: true, gt: 0 },
    date_in: { type: 'date' },
  });
  const [res] = await getPool(s.role).query('CALL add_storage_batch(?, ?, ?, ?)', [d.warehouse_id, d.crop_id, d.quantity, d.date_in]);
  return Response.json({ batch_no: res[0][0].batch_no }, { status: 201 });
});

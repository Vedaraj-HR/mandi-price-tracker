import { getPool } from '@/lib/db';
import { handler, WAREHOUSE, WAREHOUSE_ADMIN } from '@/lib/guard';
import { validate } from '@/lib/validate';

export const GET = handler(WAREHOUSE, async (_req, _ctx, s) => {
  const [res] = await getPool(s.role).query('CALL warehouse_home(?)', [s.uid]);
  return Response.json(res[0][0] ?? null);
});
export const PUT = handler(WAREHOUSE_ADMIN, async (req, _ctx, s) => {
  const d = validate(await req.json(), {
    location: { type: 'string', required: true, max: 150 },
    capacity: { type: 'number', required: true, gt: 0 },
  });
  await getPool(s.role).query('CALL update_my_warehouse(?, ?, ?)', [s.uid, d.location, d.capacity]);
  return Response.json({ ok: true });
});

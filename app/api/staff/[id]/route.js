import { getPool } from '@/lib/db';
import { handler } from '@/lib/guard';

export const DELETE = handler(['MandiAdmin', 'WarehouseAdmin'], async (_req, { params }, s) => {
  const { id } = await params;
  await getPool(s.role).query('CALL delete_staff(?, ?)', [s.uid, id]);
  return Response.json({ ok: true });
});

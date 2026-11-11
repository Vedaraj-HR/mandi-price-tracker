import { getPool } from '@/lib/db';
import { handler, MANDI_ADMIN } from '@/lib/guard';

export const DELETE = handler(MANDI_ADMIN, async (_req, { params }, s) => {
    const { id } = await params;
    await getPool(s.role).query('CALL delete_sale(?, ?)', [s.uid, id]);
    return Response.json({ ok: true });
});
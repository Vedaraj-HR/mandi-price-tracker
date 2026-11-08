
import { getPool } from '@/lib/db';
import { handler, ADMIN } from '@/lib/guard';
import { HttpError } from '@/lib/errors';

export const DELETE = handler(ADMIN, async (_req, { params }, s) => {
    const { id } = await params;
    const [r] = await getPool(s.role).query('DELETE FROM sale WHERE sale_id = ?', [id]);
    if (!r.affectedRows) throw new HttpError(404, 'Sale not found');
    return Response.json({ ok: true });
});

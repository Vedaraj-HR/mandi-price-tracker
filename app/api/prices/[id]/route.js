
import { getPool } from '@/lib/db';
import { handler, MANDI_ADMIN } from '@/lib/guard';
import { HttpError } from '@/lib/errors';

export const DELETE = handler(MANDI_ADMIN, async (_req, { params }, s) => {
    const [mandi, crop, date] = String((await params).id).split('_');
    const [r] = await getPool(s.role).query(
        'DELETE FROM price_record WHERE mandi_id = ? AND crop_id = ? AND price_date = ?',
        [mandi, crop, date]);
    if (!r.affectedRows) throw new HttpError(404, 'Price record not found');
    return Response.json({ ok: true });
});

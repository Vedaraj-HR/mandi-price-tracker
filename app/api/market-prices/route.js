import { getPool } from '@/lib/db';
import { handler, FARMER } from '@/lib/guard';

export const GET = handler(FARMER, async (req, _ctx, s) => {
    const q = `%${new URL(req.url).searchParams.get('q')?.trim() ?? ''}%`;
    const [rows] = await getPool(s.role).query(
        `SELECT CONCAT(p.mandi_id, '_', p.crop_id, '_', p.price_date) AS id,
    p.price_date, m.name AS mandi, c.crop_name AS crop,
            p.min_price, p.modal_price, p.max_price, p.source
        FROM price_record p JOIN mandi m ON m.mandi_id = p.mandi_id JOIN crop c
    ON c.crop_id = p.crop_id
        WHERE m.name LIKE ? OR c.crop_name LIKE ?
        ORDER BY p.price_date DESC, m.name, c.crop_name LIMIT 300`, [q, q]);
    return Response.json(rows);
});
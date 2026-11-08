
import { getPool } from '@/lib/db';
import { handler, ANY } from '@/lib/guard';
import { intParam } from '@/lib/validate';

export const GET = handler(ANY, async (req, _ctx, s) => {
    const crop = intParam(new URL(req.url).searchParams, 'crop');
    const [rows] = await getPool(s.role).query(
        `SELECT m.name AS mandi, p.price_date, p.modal_price,
            ROUND(AVG(p.modal_price) OVER (), 2) AS average_of_all_mandis,
            RANK() OVER (ORDER BY p.modal_price DESC) AS price_rank
          FROM price_record p JOIN mandi m ON m.mandi_id = p.mandi_id
          WHERE p.crop_id = ?
            AND p.price_date = (SELECT MAX(p2.price_date) FROM price_record p2
WHERE p2.mandi_id = p.mandi_id AND p2.crop_id = p.crop_id)
          ORDER BY price_rank`, [crop]);
    return Response.json(rows);
});

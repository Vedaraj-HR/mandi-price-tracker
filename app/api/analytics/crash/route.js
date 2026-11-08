
import { getPool } from '@/lib/db';
import { handler, ANY } from '@/lib/guard';
import { intParam } from '@/lib/validate';

export const GET = handler(ANY, async (req, _ctx, s) => {
    const sp = new URL(req.url).searchParams;
    const days = intParam(sp, 'days', false) ?? 7;
    const drop = intParam(sp, 'drop', false) ?? 15;
    const [rows] = await getPool(s.role).query(
        `WITH x AS (
            SELECT mandi_id, crop_id, price_date, modal_price,
            LAG(modal_price) OVER (PARTITION BY mandi_id, crop_id ORDER BY
price_date) AS prev_price
            FROM price_record)
     SELECT m.name AS mandi, c.crop_name AS crop, x.price_date, x.prev_price,
x.modal_price,
            ROUND((x.modal_price - x.prev_price) / x.prev_price * 100, 1) AS
pct_change
     FROM x JOIN mandi m ON m.mandi_id = x.mandi_id JOIN crop c ON c.crop_id
= x.crop_id
          WHERE x.prev_price IS NOT NULL AND x.price_date >= DATE_SUB(CURDATE(),
INTERVAL ? DAY)
       AND (x.modal_price - x.prev_price) / x.prev_price * 100 <= -?
          ORDER BY pct_change`, [days, drop]);
    return Response.json(rows);
});

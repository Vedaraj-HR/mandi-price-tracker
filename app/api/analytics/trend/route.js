
import { getPool } from '@/lib/db';
import { handler, ANY } from '@/lib/guard';
import { intParam } from '@/lib/validate';

export const GET = handler(ANY, async (req, _ctx, s) => {
    const sp = new URL(req.url).searchParams;
    const mandi = intParam(sp, 'mandi');
    const crop = intParam(sp, 'crop');
    const days = intParam(sp, 'days', false) ?? 30;
    const [rows] = await getPool(s.role).query(
        `SELECT price_date, min_price, max_price, modal_price,
            ROUND(AVG(modal_price) OVER (ORDER BY price_date ROWS BETWEEN 2
PRECEDING AND CURRENT ROW), 2) AS moving_avg,
            modal_price - LAG(modal_price) OVER (ORDER BY price_date) AS
day_change
          FROM price_record
     WHERE mandi_id = ? AND crop_id = ? AND price_date >= DATE_SUB(CURDATE(),
INTERVAL ? DAY)
          ORDER BY price_date`, [mandi, crop, days]);
    return Response.json(rows);
});

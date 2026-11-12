import { getPool } from '@/lib/db';
import { handler, FARMER } from '@/lib/guard';
import { intParam } from '@/lib/validate';

export const GET = handler(FARMER, async (req, _ctx, s) => {
    const sp = new URL(req.url).searchParams;
    const days = intParam(sp, 'days', false) ?? 7;
    const drop = intParam(sp, 'drop', false) ?? 15;

    const [rows] = await getPool(s.role).query(
        `WITH x AS (
            SELECT mandi_id, crop_id, price_date, modal_price,
                   AVG(modal_price) OVER w AS avg7, COUNT(*) OVER w AS n7
            FROM price_record
            WINDOW w AS (
                PARTITION BY mandi_id, crop_id
                ORDER BY price_date
                ROWS BETWEEN 7 PRECEDING AND 1 PRECEDING
            )
        )
        SELECT m.name AS mandi, c.crop_name AS crop, x.price_date,
               ROUND(x.avg7, 2) AS avg_previous_7, x.modal_price,
               ROUND((x.modal_price - x.avg7) / x.avg7 * 100, 1) AS pct_vs_average
        FROM x
        JOIN mandi m ON m.mandi_id = x.mandi_id
        JOIN crop c ON c.crop_id = x.crop_id
        WHERE x.n7 >= 3
          AND x.price_date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
          AND x.modal_price <= x.avg7 * (1 - ? / 100)
        ORDER BY pct_vs_average`,
        [days, drop]
    );

    return Response.json(rows);
});
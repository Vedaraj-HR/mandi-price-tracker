// app/api/recommend/route.js
import { getPool } from '@/lib/db';
import { handler, ANY } from '@/lib/guard';
import { intParam } from '@/lib/validate';


export const GET = handler(ANY, async (req, _ctx, s) => {
  const sp = new URL(req.url).searchParams;
  const from = intParam(sp, 'from');
  const crop = intParam(sp, 'crop');
  const [rows] = await getPool(s.role).query(
    `WITH RECURSIVE paths AS (
       SELECT t.destination_mandi_id AS dest_id, t.cost AS total_cost, 1 AS hops,
              CAST(CONCAT(t.source_mandi_id, '>', t.destination_mandi_id) AS CHAR(200)) AS path
       FROM transports t WHERE t.source_mandi_id = ?
       UNION ALL
       SELECT t.destination_mandi_id, p.total_cost + t.cost, p.hops + 1, CONCAT(p.path, '>', t.destination_mandi_id)
       FROM paths p JOIN transports t ON t.source_mandi_id = p.dest_id
       WHERE p.hops < 6 AND FIND_IN_SET(t.destination_mandi_id, REPLACE(p.path, '>', ',')) = 0
     ),
     cheapest AS (SELECT dest_id, MIN(total_cost) AS transport_cost FROM paths GROUP BY dest_id),
     latest AS (
       SELECT p.mandi_id, p.modal_price, p.price_date FROM price_record p
       WHERE p.crop_id = ?
         AND p.price_date = (SELECT MAX(p2.price_date) FROM price_record p2 WHERE p2.mandi_id = p.mandi_id AND p2.crop_id = p.crop_id)
     )
     SELECT r.* FROM (
       SELECT m.mandi_id, m.name AS mandi, l.price_date, l.modal_price, c.transport_cost,
              fn_net_return(l.modal_price, c.transport_cost) AS net_return
       FROM cheapest c JOIN latest l ON l.mandi_id = c.dest_id JOIN mandi m ON m.mandi_id = c.dest_id
       UNION ALL
       SELECT m.mandi_id, m.name, l.price_date, l.modal_price, 0, l.modal_price
       FROM latest l JOIN mandi m ON m.mandi_id = l.mandi_id WHERE l.mandi_id = ?
     ) r ORDER BY r.net_return DESC`, [from, crop, from]);
  return Response.json(rows);
});

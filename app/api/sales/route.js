
import { getPool } from '@/lib/db';
import { handler, ANY } from '@/lib/guard';
import { validate } from '@/lib/validate';

export const GET = handler(ANY, async (req, _ctx, s) => {
    const q = `%${new URL(req.url).searchParams.get('q')?.trim() ?? ''}%`;
    const [rows] = await getPool(s.role).query(
        `SELECT s.sale_id AS id, s.sale_date, f.name AS farmer, m.name AS mandi,
c.crop_name AS crop, s.quantity, s.price,
            ROUND(s.quantity * s.price, 2) AS total
          FROM sale s JOIN farmer f ON f.farmer_id = s.farmer_id JOIN mandi m ON
m.mandi_id = s.mandi_id JOIN crop c ON c.crop_id = s.crop_id
     WHERE f.name LIKE ? OR m.name LIKE ? OR c.crop_name LIKE ?
          ORDER BY s.sale_date DESC, s.sale_id DESC LIMIT 300`, [q, q, q]);
    return Response.json(rows);
});

// Recording a sale goes through the stored procedure record_sale (validation
// + transaction inside MySQL)
export const POST = handler(ANY, async (req, _ctx, s) => {
    const d = validate(await req.json(), {
        farmer_id: { type: 'int', required: true },
        mandi_id: { type: 'int', required: true },
        crop_id: { type: 'int', required: true },
        quantity: { type: 'number', required: true, gt: 0 },
        price: { type: 'number', required: true, gt: 0 },
        sale_date: { type: 'date' },
    });
    const [res] = await getPool(s.role).query('CALL record_sale(?, ?, ?, ?, ?, ?)',
        [d.farmer_id, d.mandi_id, d.crop_id, d.quantity, d.price, d.sale_date]);
    return Response.json({ id: res[0][0].sale_id }, { status: 201 });
});


import { getPool } from '@/lib/db';
import { handler, ANY } from '@/lib/guard';
import { validate } from '@/lib/validate';
import { HttpError } from '@/lib/errors';

export const GET = handler(ANY, async (req, _ctx, s) => {
    const q = `%${new URL(req.url).searchParams.get('q')?.trim() ?? ''}%`;
    const [rows] = await getPool(s.role).query(
        `SELECT CONCAT(p.mandi_id, '_', p.crop_id, '_', p.price_date) AS id,
p.mandi_id, m.name AS mandi, p.crop_id, c.crop_name AS crop,
            p.price_date, p.min_price, p.max_price, p.modal_price
          FROM price_record p JOIN mandi m ON m.mandi_id = p.mandi_id JOIN crop c
ON c.crop_id = p.crop_id
     WHERE m.name LIKE ? OR c.crop_name LIKE ?
          ORDER BY p.price_date DESC, m.name, c.crop_name LIMIT 300`, [q, q]);
    return Response.json(rows);
});

export const POST = handler(ANY, async (req, _ctx, s) => {
    const d = validate(await req.json(), {
        mandi_id: { type: 'int', required: true },
        crop_id: { type: 'int', required: true },
        price_date: { type: 'date', required: true },
        min_price: { type: 'number', required: true, gt: 0 },
        max_price: { type: 'number', required: true, gt: 0 },
        modal_price: { type: 'number', required: true, gt: 0 },
    });
    if (!(d.min_price <= d.modal_price && d.modal_price <= d.max_price)) {
        throw new HttpError(400, 'Prices must satisfy min <= modal <= max');
    }
    const [r] = await getPool(s.role).query(
        `INSERT INTO price_record (mandi_id, crop_id, price_date, min_price,
max_price, modal_price) VALUES (?, ?, ?, ?, ?, ?) AS new
     ON DUPLICATE KEY UPDATE min_price = new.min_price, max_price =
new.max_price, modal_price = new.modal_price`,
        [d.mandi_id, d.crop_id, d.price_date, d.min_price, d.max_price,
        d.modal_price]);
    return Response.json({ created: r.affectedRows === 1 }, { status: 201 });
});

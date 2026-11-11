import { getPool } from '@/lib/db';
import { handler, MANDI } from '@/lib/guard';
import { validate } from '@/lib/validate';

export const GET = handler(MANDI, async (req, _ctx, s) => {
    const q = new URL(req.url).searchParams.get('q')?.trim() ?? '';
    const [res] = await getPool(s.role).query('CALL list_sales(?, ?)', [s.uid, q]);
    return Response.json(res[0]);
});

export const POST = handler(MANDI, async (req, _ctx, s) => {
    const d = validate(await req.json(), {
        farmer_id: { type: 'int', required: true },
        crop_id: { type: 'int', required: true },
        quantity: { type: 'number', required: true, gt: 0 },
        price: { type: 'number', required: true, gt: 0 },
        sale_date: { type: 'date' },
    });
    const [res] = await getPool(s.role).query('CALL record_sale(?, ?, ?, ?, ?, ?)',
        [s.uid, d.farmer_id, d.crop_id, d.quantity, d.price, d.sale_date]);
    return Response.json({ id: res[0][0].sale_id }, { status: 201 });
});
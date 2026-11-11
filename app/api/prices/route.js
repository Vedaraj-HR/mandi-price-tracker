import { getPool } from '@/lib/db';
import { handler, MANDI } from '@/lib/guard';
import { validate } from '@/lib/validate';

export const GET = handler(MANDI, async (req, _ctx, s) => {
    const q = new URL(req.url).searchParams.get('q')?.trim() ?? '';
    const [res] = await getPool(s.role).query('CALL list_prices(?, ?)', [s.uid, q]);
    return Response.json(res[0]);
});

export const POST = handler(MANDI, async (req, _ctx, s) => {
    const d = validate(await req.json(), {
        crop_id: { type: 'int', required: true },
        price_date: { type: 'date' },
        min_price: { type: 'number', required: true, gt: 0 },
        max_price: { type: 'number', required: true, gt: 0 },
        modal_price: { type: 'number', required: true, gt: 0 },
    });
    await getPool(s.role).query('CALL save_price(?, ?, ?, ?, ?, ?)',
        [s.uid, d.crop_id, d.price_date, d.min_price, d.max_price, d.modal_price]);
    return Response.json({ ok: true }, { status: 201 });
});
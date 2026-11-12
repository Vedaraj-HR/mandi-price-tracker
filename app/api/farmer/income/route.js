import { getPool } from '@/lib/db';
import { handler, FARMER } from '@/lib/guard';
import { validate } from '@/lib/validate';

export const GET = handler(FARMER, async (req, _ctx, s) => {
    const sp = new URL(req.url).searchParams;
    const d = validate({ from: sp.get('from'), to: sp.get('to') }, {
        from: { type: 'date', required: true },
        to: { type: 'date', required: true },
    });
    const [res] = await getPool(s.role).query('CALL my_income(?, ?, ?)', [
        s.uid, d.from, d.to
    ]);
    return Response.json(res[0]);
});
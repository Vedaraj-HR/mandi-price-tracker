import { getPool } from '@/lib/db';
import { handler, FARMER } from '@/lib/guard';

export const GET = handler(FARMER, async (_req, _ctx, s) => {
    const [res] = await getPool(s.role).query('CALL my_sales(?)', [s.uid]);
    return Response.json(res[0]);
});
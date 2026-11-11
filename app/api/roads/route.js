import { getPool } from '@/lib/db';
import { handler, MANDI_ADMIN } from '@/lib/guard';

export const GET = handler(MANDI_ADMIN, async (_req, _ctx, s) => {
    const [res] = await getPool(s.role).query('CALL list_roads(?)', [s.uid]);
    return Response.json(res[0]);
});
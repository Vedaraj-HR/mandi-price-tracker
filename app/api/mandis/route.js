import { getPool } from '@/lib/db';
import { handler, FARMER } from '@/lib/guard';

export const GET = handler(FARMER, async (_req, _ctx, s) => {
    const [rows] = await getPool(s.role).query('SELECT mandi_id, name, location FROM mandi ORDER BY name');
    return Response.json(rows);
});
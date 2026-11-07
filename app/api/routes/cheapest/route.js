
import { getPool } from '@/lib/db';
import { handler, ANY } from '@/lib/guard';
import { intParam } from '@/lib/validate';
import { HttpError } from '@/lib/errors';
import { graphCheapest } from '@/lib/graph';
import { sqlCheapest } from '@/lib/routing';

export const GET = handler(ANY, async (req, _ctx, s) => {
    const sp = new URL(req.url).searchParams;
    const from = intParam(sp, 'from');
    const to = intParam(sp, 'to');
    if (from === to) throw new HttpError(400, 'Choose two different mandis');
    const [sql, neo4j] = await Promise.all([
        sqlCheapest(getPool(s.role), from, to),
        graphCheapest(from, to).catch((e) => ({ error: e.message })),
    ]);
    const agree = sql && neo4j && neo4j.totalCost !== undefined ?
        Math.abs(sql.totalCost - neo4j.totalCost) < 0.01 : null;
    return Response.json({ sql, neo4j, agree });
});

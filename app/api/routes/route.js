
import { getPool, withTransaction } from '@/lib/db';
import { handler, ANY, ADMIN } from '@/lib/guard';
import { validate } from '@/lib/validate';
import { HttpError } from '@/lib/errors';
import { graphUpsertRoute } from '@/lib/graph';

export const GET = handler(ANY, async (req, _ctx, s) => {
    const q = `%${new URL(req.url).searchParams.get('q')?.trim() ?? ''}%`;
    const [rows] = await getPool(s.role).query(
        `SELECT CONCAT(t.source_mandi_id, '-', t.destination_mandi_id) AS id,
sm.name AS source, dm.name AS destination, t.distance, t.cost,
            t.source_mandi_id, t.destination_mandi_id
          FROM transports t JOIN mandi sm ON sm.mandi_id = t.source_mandi_id JOIN
mandi dm ON dm.mandi_id = t.destination_mandi_id
     WHERE sm.name LIKE ? OR dm.name LIKE ? ORDER BY sm.name, dm.name LIMIT
500`, [q, q]);
    return Response.json(rows);
});

export const POST = handler(ADMIN, async (req, _ctx, s) => {
    const body = await req.json();
    const d = validate(body, {
        source_mandi_id: { type: 'int', required: true },
        destination_mandi_id: { type: 'int', required: true },
        distance: { type: 'number', required: true, gt: 0 },
        cost: { type: 'number', required: true, min: 0 },
    });
    const a = d.source_mandi_id;
    const b = d.destination_mandi_id;
    if (a === b) throw new HttpError(400, 'A road must join two different mandis');
    const pairs = [[a, b]];
    if (body.bidirectional) pairs.push([b, a]);

    await withTransaction(s.role, async (conn) => {
        const [names] = await conn.query('SELECT mandi_id, name FROM mandi WHERE mandi_id IN (?)', [[a, b]]);
        const nm = Object.fromEntries(names.map((n) => [n.mandi_id, n.name]));
        for (const [src, dst] of pairs) {
            await conn.query('INSERT INTO transports (source_mandi_id, destination_mandi_id, distance, cost) VALUES (?, ?, ?, ?)', [src, dst, d.distance, d.cost]);
            await graphUpsertRoute({ src, srcName: nm[src], dst, dstName: nm[dst], distance: d.distance, cost: d.cost });
        }
    });
    return Response.json({ ok: true }, { status: 201 });
});

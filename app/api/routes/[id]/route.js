
import { withTransaction } from '@/lib/db';
import { handler, ADMIN } from '@/lib/guard';
import { validate } from '@/lib/validate';
import { HttpError } from '@/lib/errors';
import { graphUpdateRoute, graphDeleteRoute } from '@/lib/graph';

function parseId(id) {
    const [src, dst] = String(id).split('-').map(Number);
    if (!Number.isInteger(src) || !Number.isInteger(dst)) throw new HttpError(400, 'Bad road id');
    return { src, dst };
}

export const PUT = handler(ADMIN, async (req, { params }, s) => {
    const { src, dst } = parseId((await params).id);
    const d = validate(await req.json(), {
        distance: { type: 'number', required: true, gt: 0 },
        cost: { type: 'number', required: true, min: 0 },
    });
    await withTransaction(s.role, async (conn) => {
        const [r] = await conn.query('UPDATE transports SET distance = ?, cost = ? WHERE source_mandi_id = ? AND destination_mandi_id = ?', [d.distance, d.cost, src, dst]);
        if (!r.affectedRows) throw new HttpError(404, 'Road not found');
        await graphUpdateRoute({ src, dst, distance: d.distance, cost: d.cost });
    });
    return Response.json({ ok: true });
});

export const DELETE = handler(ADMIN, async (_req, { params }, s) => {
    const { src, dst } = parseId((await params).id);
    await withTransaction(s.role, async (conn) => {
        const [r] = await conn.query('DELETE FROM transports WHERE source_mandi_id = ? AND destination_mandi_id = ?', [src, dst]);
        if (!r.affectedRows) throw new HttpError(404, 'Road not found');
        await graphDeleteRoute({ src, dst });
    });
    return Response.json({ ok: true });
});

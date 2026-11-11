import { getPool, withTransaction } from '@/lib/db';
import { handler, MANDI_ADMIN } from '@/lib/guard';
import { HttpError } from '@/lib/errors';
import { roadDistancesKm } from '@/lib/geo.mjs';
import { graphSetRoad, graphDeleteRoad } from '@/lib/graph';

export const PUT = handler(MANDI_ADMIN, async (req, { params }, s) => {
    const dst = Number((await params).id);
    const { action } = await req.json();
    if (!['close', 'open', 'refresh', 'delete'].includes(action)) throw new HttpError(400, 'Unknown action');

    let distance = null;
    let message = 'Done';
    if (action === 'refresh') {
        // mandi coordinates are public, so they are read through the public (auth) account
        const [rows] = await getPool('Auth').query('SELECT mandi_id, latitude, longitude FROM mandi WHERE mandi_id IN (?)', [[s.mandiId, dst]]);
        const a = rows.find((r) => r.mandi_id === s.mandiId);
        const b = rows.find((r) => r.mandi_id === dst);
        if (!a || !b || a.latitude === null || b.latitude === null) throw new HttpError(400, 'Mandi coordinates are missing');
        const out = await roadDistancesKm({ lat: Number(a.latitude), lng: Number(a.longitude) }, [{ lat: Number(b.latitude), lng: Number(b.longitude) }]);
        distance = out.km[0];
        message = out.mapped ? `Distance refreshed from the map service: ${distance} km` : `Map service unavailable, estimated distance saved: ${distance} km`;
    }
    const procAction = action === 'refresh' ? 'distance' : action;

    await withTransaction(s.role, async (conn) => {
        const [res] = await conn.query('CALL manage_road(?, ?, ?, ?)', [s.uid, dst, procAction, distance]);
        if (action === 'delete') {
            await graphDeleteRoad({ src: s.mandiId, dst });
        } else {
            const row = res[0][0];
            await graphSetRoad({ src: s.mandiId, dst, distance: row.distance, open: row.is_open === 1 });
        }
    });
    return Response.json({ ok: true, message });
});
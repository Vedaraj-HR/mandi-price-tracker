import { getPool } from '@/lib/db';
import { handler, FARMER } from '@/lib/guard';
import { validate } from '@/lib/validate';
import { HttpError } from '@/lib/errors';
import { geocode, roadDistancesKm, nearestMandis } from '@/lib/geo.mjs';
import { graphSyncFarmer } from '@/lib/graph';

export const GET = handler(FARMER, async (_req, _ctx, s) => {
    const pool = getPool(s.role);
    const [pr] = await pool.query('CALL my_profile(?)', [s.uid]);
    const [nr] = await pool.query('CALL my_near(?)', [s.uid]);
    const ids = nr[0].map((r) => r.mandi_id);
    const [names] = ids.length
        ? await pool.query('SELECT mandi_id, name FROM mandi WHERE mandi_id IN (?)', [ids])
        : [[]];
    const nm = Object.fromEntries(names.map((n) => [n.mandi_id, n.name]));
    return Response.json({
        profile: pr[0][0] ?? null,
        near: nr[0].map((r) => ({
            mandi: nm[r.mandi_id],
            distance: r.distance
        }))
    });
});

export const PUT = handler(FARMER, async (req, _ctx, s) => {
    const d = validate(await req.json(), {
        name: { type: 'string', required: true, max: 100 },
        phone: {
            type: 'string',
            required: true,
            pattern: /^[0-9+]{10,15}$/,
            message: 'Phone must be 10 to 15 digits (optional +)'
        },
        place: { type: 'string', required: true, max: 150 },
        latitude: { type: 'number' },
        longitude: { type: 'number' },
    });
    const pool = getPool(s.role);
    const [pr] = await pool.query('CALL my_profile(?)', [s.uid]);
    const cur = pr[0][0];
    if (!cur) throw new HttpError(404, 'No farmer profile found');

    let point = d.latitude !== null && d.longitude !== null
        ? { lat: d.latitude, lng: d.longitude }
        : await geocode(d.place);

    if (!point && d.place === cur.place && cur.latitude !== null) {
        point = {
            lat: Number(cur.latitude),
            lng: Number(cur.longitude)
        };
    }
    if (!point) {
        throw new HttpError(400, 'We could not find that place. Please also enter its latitude and longitude.');
    }

    const [mandis] = await pool.query(
        'SELECT mandi_id, name, latitude, longitude FROM mandi'
    );
    const nearest = nearestMandis(point, mandis, 3);
    if (!nearest.length) {
        throw new HttpError(400, 'No mandis with coordinates exist yet');
    }
    const { km } = await roadDistancesKm(
        point,
        nearest.map((m) => ({ lat: m.lat, lng: m.lng }))
    );
    const near = nearest.map((m, i) => ({
        mandiId: m.mandi_id,
        distance: Math.max(0.1, km[i])
    }));

    await pool.query('CALL update_my_profile(?, ?, ?, ?, ?, ?, ?)', [
        s.uid, d.name, d.phone, d.place, point.lat, point.lng, JSON.stringify(near)
    ]);

    let graph = 'Neo4j updated';
    try {
        await graphSyncFarmer({
            id: cur.farmer_id,
            name: d.name,
            lat: point.lat,
            lng: point.lng,
            near
        });
    } catch {
        graph = 'Saved. The graph copy will update at your next search.';
    }
    return Response.json({ ok: true, graph });
});
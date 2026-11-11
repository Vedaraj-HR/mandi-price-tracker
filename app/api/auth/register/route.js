
import bcrypt from 'bcryptjs';
import { getPool } from '@/lib/db';
import { validate } from '@/lib/validate';
import { HttpError, toResponse } from '@/lib/errors';
import { geocode, roadDistancesKm, nearestMandis } from '@/lib/geo.mjs';
import { graphSyncFarmer } from '@/lib/graph';

export async function POST(req) {
    try {
        const d = validate(await req.json(), {
            username: { type: 'string', required: true, pattern: /^[A-Za-z0-9_.]{3,50}$/, message: 'Username: 3 to 50 letters, digits, dot or underscore' },
            password: { type: 'string', required: true, pattern: /^.{8,72}$/, message: 'Password must be 8 to 72 characters' },
            name: { type: 'string', required: true, max: 100 },
            phone: { type: 'string', required: true, pattern: /^[0-9+]{10,15}$/, message: 'Phone must be 10 to 15 digits (optional +)' },
            place: { type: 'string', required: true, max: 150 },
            latitude: { type: 'number' },
            longitude: { type: 'number' },
        });

        const point = d.latitude !== null && d.longitude !== null
            ? { lat: d.latitude, lng: d.longitude }
            : await geocode(d.place);

        if (!point) throw new HttpError(400, 'We could not find that place. Please also enter its latitude and longitude.');

        const [mandis] = await getPool('Auth').query('SELECT mandi_id, name, latitude, longitude FROM mandi');
        const nearest = nearestMandis(point, mandis, 3);

        if (!nearest.length) throw new HttpError(400, 'No mandis with coordinates exist yet. Ask the mandi office.');

        const { km } = await roadDistancesKm(point, nearest.map((m) => ({ lat: m.lat, lng: m.lng })));
        const near = nearest.map((m, i) => ({ mandiId: m.mandi_id, distance: Math.max(0.1, km[i]) }));

        const hash = await bcrypt.hash(d.password, 10);

        const [res] = await getPool('Auth').query('CALL register_farmer(?, ?, ?, ?, ?, ?, ?, ?)',
            [d.username, hash, d.name, d.phone, d.place, point.lat, point.lng, JSON.stringify(near)]);

        const farmerId = res[0][0].farmer_id;

        try {
            await graphSyncFarmer({ id: farmerId, name: d.name, lat: point.lat, lng: point.lng, near });
        } catch {
            // the graph copy is rebuilt from MySQL at the first search or by npm run graph:sync
        }

        return Response.json({ ok: true }, { status: 201 });
    } catch (e) {
        return toResponse(e);
    }
}

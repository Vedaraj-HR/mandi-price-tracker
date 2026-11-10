import { getPool } from '@/lib/db';
import { handler, MANDI, MANDI_ADMIN } from '@/lib/guard';
import { validate } from '@/lib/validate';
import { runCypher } from '@/lib/neo4j';

export const GET = handler(MANDI, async (_req, _ctx, s) => {
  const [res] = await getPool(s.role).query('CALL mandi_home(?)', [s.uid]);
  return Response.json(res[0][0] ?? null);
});
export const PUT = handler(MANDI_ADMIN, async (req, _ctx, s) => {
  const d = validate(await req.json(), {
    name: { type: 'string', required: true, max: 100 },
    location: { type: 'string', required: true, max: 150 },
    latitude: { type: 'number', min: -90 },
    longitude: { type: 'number', min: -180 },
  });
  await getPool(s.role).query('CALL update_my_mandi(?, ?, ?, ?, ?)', [s.uid, d.name, d.location, d.latitude, d.longitude]);
  try {
    await runCypher('MATCH (m:Mandi {id: toInteger($id)}) SET m.name = $name, m.location = $location, m.lat = toFloat($lat), m.lng = toFloat($lng)',
      { id: s.mandiId, name: d.name, location: d.location, lat: d.latitude, lng: d.longitude });
  } catch { /* graph is realigned by graph:sync */ }
  return Response.json({ ok: true });
});

import { getPool } from '@/lib/db';
import { handler, FARMER } from '@/lib/guard';
import { intParam } from '@/lib/validate';
import { HttpError } from '@/lib/errors';
import { graphSyncFarmer, graphFarmerDistances } from '@/lib/graph';

const round = (v, d = 2) => Math.round(v * 10 ** d) / 10 ** d;

export const GET = handler(FARMER, async (req, _ctx, s) => {
    const sp = new URL(req.url).searchParams;
    const crop = intParam(sp, 'crop');
    const qty = Number(sp.get('qty'));
    if (!(qty > 0)) throw new HttpError(400, 'Quantity must be greater than zero');
    const rateRaw = sp.get('rate');
    const rate = rateRaw === null || rateRaw.trim() === '' ? null : Number(rateRaw);
    if (rate !== null && !(rate >= 0)) throw new HttpError(400, 'Rate per km must be a number');
    const mult = sp.get('return') === '1' ? 2 : 1;

    const pool = getPool(s.role);
    const [pr] = await pool.query('CALL my_profile(?)', [s.uid]);
    const me = pr[0][0];
    if (!me || me.latitude === null) throw new HttpError(400, 'Set your location on the Profile page first');
    const [nr] = await pool.query('CALL my_near(?)', [s.uid]);
    const near = nr[0].map((r) => ({ mandiId: r.mandi_id, distance: r.distance }));
    if (!near.length) throw new HttpError(400, 'No nearby mandis are saved for you. Save your Profile again.');

    // make sure the Neo4j copy of this farmer matches MySQL, then read distances to every mandi
    await graphSyncFarmer({ id: me.farmer_id, name: me.name, lat: me.latitude, lng: me.longitude, near });
    const dist = await graphFarmerDistances(me.farmer_id);
    const dmap = new Map(dist.map((d) => [d.mandiId, d.distance]));

    const [prices] = await pool.query(
        `SELECT m.mandi_id, m.name, m.location, p.modal_price, p.price_date, p.source
         FROM price_record p JOIN mandi m ON m.mandi_id = p.mandi_id
         WHERE p.crop_id = ? AND p.price_date = (SELECT MAX(p2.price_date) FROM price_record p2 WHERE p2.mandi_id = p.mandi_id AND p2.crop_id = p.crop_id)`, [crop]);

    let rows = prices.filter((p) => dmap.has(p.mandi_id)).map((p) => {
        const distance = round(dmap.get(p.mandi_id), 1);
        const income = round(qty * p.modal_price);
        const transport = rate === null ? null : round(distance * rate * mult);
        return {
            mandi_id: p.mandi_id, mandi: p.name, location: p.location, price_date: p.price_date, source: p.source,
            price_per_quintal: p.modal_price, distance_km: distance, income,
            transport_cost: transport, net_profit: transport === null ? null : round(income - transport),
        };
    });
    if (!rows.length) throw new HttpError(404, 'No prices exist for this crop in any mandi you can reach');

    rows.sort(rate === null ? (a, b) => b.price_per_quintal - a.price_per_quintal : (a, b) => b.net_profit - a.net_profit);
    const nearest = rows.reduce((a, b) => (b.distance_km < a.distance_km ? b : a));
    rows = rows.map((r) => {
        let breakEven = null;
        if (r.mandi_id !== nearest.mandi_id) {
            if (r.price_per_quintal <= nearest.price_per_quintal) breakEven = 'never better';
            else if (r.distance_km <= nearest.distance_km) breakEven = 'always better';
            else breakEven = round((qty * (r.price_per_quintal - nearest.price_per_quintal)) / (mult * (r.distance_km - nearest.distance_km)));
        }
        return { ...r, break_even_rate_per_km: breakEven };
    });
    return Response.json({ ranked_by: rate === null ? 'price' : 'net profit', nearest: nearest.mandi, rows });
});
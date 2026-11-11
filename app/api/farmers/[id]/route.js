import { getPool, withTransaction } from '@/lib/db';
import { handler, MANDI } from '@/lib/guard';
import { parseFarmer } from '@/lib/farmers';
import { HttpError } from '@/lib/errors';
import { graphDeleteFarmer } from '@/lib/graph';

export const PUT = handler(MANDI, async (req, { params }, s) => {
    const { id } = await params;
    const { data, contacts } = parseFarmer(await req.json());
    await withTransaction(s.role, async (conn) => {
        const [r] = await conn.query('UPDATE farmer SET name = ?, phone = ?, address = ? WHERE farmer_id = ?', [data.name, data.phone, data.address, id]);
        if (!r.affectedRows) throw new HttpError(404, 'Farmer not found');
        await conn.query('DELETE FROM farmer_contact WHERE farmer_id = ?', [id]);
        if (contacts.length) await conn.query('INSERT INTO farmer_contact (farmer_id, contact_number) VALUES ?', [contacts.map((c) => [id, c])]);
    });
    return Response.json({ ok: true });
});

// the procedure also removes the farmer's login; the Neo4j node is removed afterwards
export const DELETE = handler(MANDI, async (_req, { params }, s) => {
    const { id } = await params;
    await getPool(s.role).query('CALL delete_farmer(?, ?)', [s.uid, id]);
    try {
        await graphDeleteFarmer(Number(id));
    } catch {
        // a leftover node is removed by npm run graph:sync
    }
    return Response.json({ ok: true });
});
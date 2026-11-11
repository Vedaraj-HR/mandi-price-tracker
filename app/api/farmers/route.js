
import { getPool, withTransaction } from '@/lib/db';
import { handler, MANDI } from '@/lib/guard';
import { parseFarmer } from '@/lib/farmers';

export const GET = handler(MANDI, async (req, _ctx, s) => {
    const q = `%${new URL(req.url).searchParams.get('q')?.trim() ?? ''}%`;
    const [rows] = await getPool(s.role).query(
        `SELECT f.farmer_id, f.name, f.phone, f.address, IF(f.user_id IS NULL,
'no', 'yes') AS has_login,
            GROUP_CONCAT(fc.contact_number ORDER BY fc.contact_number
SEPARATOR ', ') AS alt_contacts
        FROM farmer f LEFT JOIN farmer_contact fc ON fc.farmer_id = f.farmer_id
        WHERE f.name LIKE ? OR f.phone LIKE ?
        GROUP BY f.farmer_id, f.name, f.phone, f.address, f.user_id ORDER BY
f.name LIMIT 500`, [q, q]);
    return Response.json(rows);
});

export const POST = handler(MANDI, async (req, _ctx, s) => {
    const { data, contacts } = parseFarmer(await req.json());
    const id = await withTransaction(s.role, async (conn) => {
        const [r] = await conn.query('INSERT INTO farmer (name, phone, address) VALUES (?, ?, ?)', [data.name, data.phone, data.address]);
        if (contacts.length) await conn.query('INSERT INTO farmer_contact (farmer_id, contact_number) VALUES ?', [contacts.map((c) => [r.insertId, c])]);
        return r.insertId;
    });
    return Response.json({ id }, { status: 201 });
});

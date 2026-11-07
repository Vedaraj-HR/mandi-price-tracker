// app/api/farmers/[id]/route.js
import { getPool, withTransaction } from '@/lib/db';
import { handler, ANY } from '@/lib/guard';
import { parseFarmer } from '@/lib/farmers';
import { HttpError } from '@/lib/errors';

export const PUT = handler(ANY, async (req, { params }, s) => {
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

export const DELETE = handler(ANY, async (_req, { params }, s) => {
  const { id } = await params;
  const [r] = await getPool(s.role).query('DELETE FROM farmer WHERE farmer_id = ?', [id]);
  if (!r.affectedRows) throw new HttpError(404, 'Farmer not found');
  return Response.json({ ok: true });
});

// app/api/users/[id]/route.js
import bcrypt from 'bcryptjs';
import { getPool } from '@/lib/db';
import { handler, ADMIN } from '@/lib/guard';
import { validate } from '@/lib/validate';
import { HttpError } from '@/lib/errors';


export const PUT = handler(ADMIN, async (req, { params }, s) => {
  const { id } = await params;
  const d = validate(await req.json(), {
    role: { type: 'enum', required: true, values: ['Admin', 'Staff'] },
    password: { type: 'string', pattern: /^.{8,72}$/, message: 'Password must be 8 to 72 characters' },
  });
  const pool = getPool(s.role);

  const [r] = d.password
    ? await pool.query('UPDATE users SET role = ?, password_hash = ? WHERE user_id = ?', [d.role, await bcrypt.hash(d.password, 10), id])
    : await pool.query('UPDATE users SET role = ? WHERE user_id = ?', [d.role, id]);
  if (!r.affectedRows) throw new HttpError(404, 'User not found');
  return Response.json({ ok: true });
});


export const DELETE = handler(ADMIN, async (_req, { params }, s) => {
  const { id } = await params;
  if (Number(id) === s.uid) throw new HttpError(400, 'You cannot delete your own account');
  const [r] = await getPool(s.role).query('DELETE FROM users WHERE user_id = ?', [id]);
  if (!r.affectedRows) throw new HttpError(404, 'User not found');
  return Response.json({ ok: true });
});

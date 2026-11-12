// app/api/users/route.js
import bcrypt from 'bcryptjs';
import { getPool } from '@/lib/db';
import { handler, MANDI_ADMIN } from '@/lib/guard';
import { validate } from '@/lib/validate';

export const GET = handler(MANDI_ADMIN, async (req, _ctx, s) => {
  const q = `%${new URL(req.url).searchParams.get('q')?.trim() ?? ''}%`;
  const [rows] = await getPool(s.role).query('SELECT user_id, username, role FROM users WHERE username LIKE ? ORDER BY username', [q]);
  return Response.json(rows);
});

export const POST = handler(ADMIN, async (req, _ctx, s) => {
  const d = validate(await req.json(), {
    username: { type: 'string', required: true, pattern: /^[A-Za-z0-9_.]{3,50}$/, message: 'Username: 3 to 50 letters, digits, dot or underscore' },
    role: { type: 'enum', required: true, values: ['Admin', 'Staff'] },
    password: { type: 'string', required: true, pattern: /^.{8,72}$/, message: 'Password must be 8 to 72 characters' },
  });
  const hash = await bcrypt.hash(d.password, 10);
  const [r] = await getPool(s.role).query('INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)', [d.username, hash, d.role]);
  return Response.json({ id: r.insertId }, { status: 201 });
});

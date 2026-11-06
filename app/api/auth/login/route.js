// app/api/auth/login/route.js
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { getPool } from '@/lib/db';
import { signToken, COOKIE } from '@/lib/token';
import { HttpError, toResponse } from '@/lib/errors';


export async function POST(req) {
  try {
    const { username, password } = await req.json();
    if (!username || !password) throw new HttpError(400, 'Username and password are required');
    const [rows] = await getPool('Auth').query(
      'SELECT user_id, username, password_hash, role FROM users WHERE username = ?', [username]);
    const user = rows[0];
    const ok = user ? await bcrypt.compare(password, user.password_hash) : false;
    if (!ok) throw new HttpError(401, 'Invalid username or password');

    const token = await signToken({ uid: user.user_id, username: user.username, role: user.role });
    (await cookies()).set(COOKIE, token, {
      httpOnly: true, sameSite: 'lax', path: '/', maxAge: 60 * 60 * 8,
      secure: process.env.NODE_ENV === 'production',
    });
    return Response.json({ username: user.username, role: user.role });
  } catch (e) {
    return toResponse(e);
  }
}

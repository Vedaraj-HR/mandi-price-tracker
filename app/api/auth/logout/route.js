// app/api/auth/logout/route.js
import { cookies } from 'next/headers';
import { COOKIE } from '@/lib/token';


export async function POST() {
  (await cookies()).delete(COOKIE);
  return Response.json({ ok: true });
}
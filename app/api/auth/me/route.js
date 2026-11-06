// app/api/auth/me/route.js
import { getSession } from '@/lib/guard';
 
export async function GET() {
  const s = await getSession();
  if (!s) return Response.json({ error: 'Not logged in' }, { status: 401 });
  return Response.json({ username: s.username, role: s.role });
}
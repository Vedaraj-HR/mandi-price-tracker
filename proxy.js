import { NextResponse } from 'next/server';
import { verifyToken, COOKIE } from './lib/token';


export async function proxy(request) {
  const token = request.cookies.get(COOKIE)?.value;
  const session = token ? await verifyToken(token) : null;
  if (session) return NextResponse.next();
  if (request.nextUrl.pathname.startsWith('/api/')) {
    return NextResponse.json({ error: 'Not logged in' }, { status: 401 });
  }
  return NextResponse.redirect(new URL('/login', request.url));
}


export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|login|api/auth/login).*)'],
};

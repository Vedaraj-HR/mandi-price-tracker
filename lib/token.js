// lib/token.js (only uses jose, so proxy.js can import it)
import { SignJWT, jwtVerify } from 'jose';


export const COOKIE = 'mandi_session';
const secret = () => new TextEncoder().encode(process.env.AUTH_SECRET);

export async function signToken(payload) {
  return new SignJWT(payload).setProtectedHeader({ alg: 'HS256' }).setIssuedAt().setExpirationTime('8h').sign(secret());
}


export async function verifyToken(token) {
  try {
    const { payload } = await jwtVerify(token, secret(), { algorithms: ['HS256'] });
    return payload;
  } catch {
    return null;
  }
}

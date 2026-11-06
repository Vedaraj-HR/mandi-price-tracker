// lib/guard.js
import { cookies } from 'next/headers';
import { COOKIE, verifyToken } from './token';
import { HttpError, toResponse } from './errors';


export const ANY = ['Admin', 'Staff'];
export const ADMIN = ['Admin'];


export async function getSession() {
  const token = (await cookies()).get(COOKIE)?.value;
  return token ? await verifyToken(token) : null;
}


// Wraps an API handler: 401 if not logged in, 403 if the role is not allowed,
// MySQL/Neo4j errors become clean JSON.
export function handler(roles, fn) {
  return async (req, ctx) => {
    try {
      const session = await getSession();
      if (!session) throw new HttpError(401, 'Please log in');
      if (!roles.includes(session.role)) throw new HttpError(403, 'Your role is not allowed to do this');
      return await fn(req, ctx, session);
    } catch (e) {
      return toResponse(e);
    }
  };
}

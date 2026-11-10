import { cookies } from 'next/headers';
import { COOKIE, verifyToken } from './token';
import { HttpError, toResponse } from './errors';

export const FARMER = ['Farmer'];
export const MANDI = ['MandiAdmin', 'MandiStaff'];
export const MANDI_ADMIN = ['MandiAdmin'];
// Backward-compatible alias for routes replaced in later application rounds.
export const ADMIN = MANDI_ADMIN;
export const WAREHOUSE = ['WarehouseAdmin', 'WarehouseStaff'];
export const WAREHOUSE_ADMIN = ['WarehouseAdmin'];
export const ANY = [...FARMER, ...MANDI, ...WAREHOUSE];

export async function getSession() {
  const token = (await cookies()).get(COOKIE)?.value;
  return token ? await verifyToken(token) : null;
}

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

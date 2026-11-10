import bcrypt from 'bcryptjs';
import { getPool } from '@/lib/db';
import { handler } from '@/lib/guard';
import { validate } from '@/lib/validate';

const ADMINS = ['MandiAdmin', 'WarehouseAdmin'];
export const GET = handler(ADMINS, async (_req, _ctx, s) => {
  const [res] = await getPool(s.role).query('CALL list_staff(?)', [s.uid]);
  return Response.json(res[0]);
});
export const POST = handler(ADMINS, async (req, _ctx, s) => {
  const d = validate(await req.json(), {
    username: { type: 'string', required: true, pattern: /^[A-Za-z0-9_.]{3,50}$/ },
    password: { type: 'string', required: true, pattern: /^.{8,72}$/ },
  });
  const hash = await bcrypt.hash(d.password, 10);
  const [res] = await getPool(s.role).query('CALL create_staff(?, ?, ?)', [s.uid, d.username, hash]);
  return Response.json({ id: res[0][0].user_id }, { status: 201 });
});

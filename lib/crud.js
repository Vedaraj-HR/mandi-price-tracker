// lib/crud.js : generic list/create/update/delete for simple tables (crop, mandi, warehouse).
// Table and column names come from OUR config files, never from the user;
// values always use placeholders.
import { getPool } from './db';
import { handler, ANY, ADMIN } from './guard';
import { validate } from './validate';
import { HttpError } from './errors';


export function collection(cfg) {
  const GET = handler(ANY, async (req, _ctx, s) => {
    const q = new URL(req.url).searchParams.get('q')?.trim();
    const params = [];
    let where = '';
    if (q && cfg.search?.length) {
      where = ' WHERE ' + cfg.search.map((c) => `${c} LIKE ?`).join(' OR ');
      cfg.search.forEach(() => params.push(`%${q}%`));
    }
    const [rows] = await getPool(s.role).query(`SELECT * FROM ${cfg.table}${where} ORDER BY ${cfg.order ?? cfg.pk} LIMIT 500`, params);
    return Response.json(rows);
  });

  const POST = handler(cfg.writeRoles ?? ADMIN, async (req, _ctx, s) => {
    const data = validate(await req.json(), cfg.schema);
    const cols = Object.keys(data);
    const [r] = await getPool(s.role).query(
      `INSERT INTO ${cfg.table} (${cols.join(', ')}) VALUES (${cols.map(() => '?').join(', ')})`, cols.map((c) => data[c]));
    return Response.json({ id: r.insertId }, { status: 201 });
  });
  return { GET, POST };
}


export function item(cfg) {
  const PUT = handler(cfg.writeRoles ?? ADMIN, async (req, { params }, s) => {
    const { id } = await params;
    const data = validate(await req.json(), cfg.schema);
    const cols = Object.keys(data);
    const [r] = await getPool(s.role).query(
      `UPDATE ${cfg.table} SET ${cols.map((c) => `${c} = ?`).join(', ')} WHERE ${cfg.pk} = ?`, [...cols.map((c) => data[c]), id]);
    if (!r.affectedRows) throw new HttpError(404, 'Record not found');
    return Response.json({ ok: true });
  });


  const DELETE = handler(cfg.deleteRoles ?? ADMIN, async (_req, { params }, s) => {
    const { id } = await params;
    const [r] = await getPool(s.role).query(`DELETE FROM ${cfg.table} WHERE ${cfg.pk} = ?`, [id]);
    if (!r.affectedRows) throw new HttpError(404, 'Record not found');
    return Response.json({ ok: true });
  });
  return { PUT, DELETE };
}

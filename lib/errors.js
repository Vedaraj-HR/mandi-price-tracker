// lib/errors.js
export class HttpError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}


const MYSQL = {
  ER_DUP_ENTRY: [409, 'That record already exists (duplicate value)'],
  ER_NO_REFERENCED_ROW_2: [400, 'A referenced record does not exist'],
  ER_ROW_IS_REFERENCED_2: [409, 'Cannot delete: other records depend on this one'],
  ER_CHECK_CONSTRAINT_VIOLATED: [400, 'A value breaks a database rule (CHECK constraint)'],
  ER_BAD_NULL_ERROR: [400, 'A required value is missing'],
  ER_TABLEACCESS_DENIED_ERROR: [403, 'Denied by the database: your role has no permission for this'],
  ER_COLUMNACCESS_DENIED_ERROR: [403, 'Denied by the database: your role cannot read that column'],
  ER_PROCACCESS_DENIED_ERROR: [403, 'Denied by the database: your role cannot run that routine'],
};


export function toResponse(e) {
  if (e instanceof HttpError) return Response.json({ error: e.message }, { status: e.status });
  if (e?.code && MYSQL[e.code]) {
    const [status, error] = MYSQL[e.code];
    return Response.json({ error, code: e.code }, { status });
  }
  if (e?.sqlState === '45000') return Response.json({ error: e.sqlMessage }, { status: 400 });
  if (e?.name === 'Neo4jError') return Response.json({ error: `Graph database error: ${e.message}` }, { status: 502 });
  console.error(e);
  return Response.json({ error: 'Server error' }, { status: 500 });
}

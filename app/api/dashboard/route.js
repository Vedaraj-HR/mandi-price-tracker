// app/api/dashboard/route.js
import { getPool } from '@/lib/db';
import { handler, ANY } from '@/lib/guard';

export const GET = handler(ANY, async (_req, _ctx, s) => {
  const pool = getPool(s.role);
  const [[counts]] = await pool.query(
    `SELECT (SELECT COUNT(*) FROM farmer) AS farmers, (SELECT COUNT(*) FROM mandi) AS mandis,
            (SELECT COUNT(*) FROM sale) AS sales, (SELECT COALESCE(SUM(quantity * price), 0) FROM sale) AS revenue`);
  const [topMandis] = await pool.query('SELECT name, total_sales FROM mandi_total_sales ORDER BY total_sales DESC LIMIT 5');
  return Response.json({ counts, topMandis });
});

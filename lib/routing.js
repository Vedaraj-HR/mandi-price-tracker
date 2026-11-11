
export async function sqlCheapest(pool, from, to) {
  const [rows] = await pool.query(
    `WITH RECURSIVE paths AS (
       SELECT t.destination_mandi_id AS dest_id, t.cost AS total_cost,
              t.distance AS total_dist, 1 AS hops,
              CAST(CONCAT(t.source_mandi_id, '>', t.destination_mandi_id) AS CHAR(200)) AS path
       FROM transports t WHERE t.source_mandi_id = ? AND t.is_open = 1
       UNION ALL
       SELECT t.destination_mandi_id, p.total_cost + t.cost, p.total_dist + t.distance, p.hops + 1,
              CONCAT(p.path, '>', t.destination_mandi_id)
       FROM paths p JOIN transports t ON t.source_mandi_id = p.dest_id AND t.is_open = 1
       WHERE p.hops < 6 AND FIND_IN_SET(t.destination_mandi_id, REPLACE(p.path, '>', ',')) = 0
     )
     SELECT path, total_cost, total_dist FROM paths WHERE dest_id = ?
     ORDER BY total_cost, total_dist LIMIT 1`,
    [from, to]
  );
  if (!rows.length) return null;
  const ids = rows[0].path.split('>').map(Number);
  const [names] = await pool.query(
    'SELECT mandi_id, name FROM mandi WHERE mandi_id IN (?)',
    [ids]
  );
  const byId = Object.fromEntries(names.map((n) => [n.mandi_id, n.name]));
  return {
    route: ids.map((i) => byId[i]),
    totalCost: rows[0].total_cost,
    totalDistance: rows[0].total_dist
  };
}

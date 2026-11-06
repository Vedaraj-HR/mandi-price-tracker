
import { runCypher } from './neo4j';
import { HttpError } from './errors';

// CREATE (or overwrite) a road. Mandi nodes are created if missing.
export async function graphUpsertRoute({ src, srcName, dst, dstName, distance, cost }) {
  await runCypher(
    'MERGE (a:Mandi {id: toInteger($src)}) SET a.name = $srcName ' +
    'MERGE (b:Mandi {id: toInteger($dst)}) SET b.name = $dstName ' +
    'MERGE (a)-[r:ROUTE]->(b) SET r.distance = toFloat($distance), r.cost = toFloat($cost)',
    { src, srcName, dst, dstName, distance, cost }
  );
}

// UPDATE a road
export async function graphUpdateRoute({ src, dst, distance, cost }) {
  const rec = await runCypher(
    'MATCH (:Mandi {id: toInteger($src)})-[r:ROUTE]->(:Mandi {id: toInteger($dst)}) ' +
    'SET r.distance = toFloat($distance), r.cost = toFloat($cost) RETURN count(r) AS n',
    { src, dst, distance, cost }
  );
  if (rec[0].get('n') === 0) throw new HttpError(409, 'Road missing in Neo4j. Run npm run graph:sync to re-align the graph with MySQL.');
}

// DELETE a road
export async function graphDeleteRoute({ src, dst }) {
  await runCypher(
    'MATCH (:Mandi {id: toInteger($src)})-[r:ROUTE]->(:Mandi {id: toInteger($dst)}) DELETE r',
    { src, dst }
  );
}

// READ: cheapest route by total cost (path search over ROUTE relationships, at most 6 roads)
export async function graphCheapest(src, dst) {
  const rec = await runCypher(
    'MATCH p = (a:Mandi {id: toInteger($src)})-[:ROUTE*1..6]->(b:Mandi {id: toInteger($dst)}) ' +
    'WITH p, reduce(c = 0.0, r IN relationships(p) | c + r.cost) AS totalCost, ' +
    'reduce(k = 0.0, r IN relationships(p) | k + r.distance) AS totalDistance ' +
    'RETURN [n IN nodes(p) | n.name] AS route, totalCost, totalDistance ' +
    'ORDER BY totalCost ASC, totalDistance ASC LIMIT 1',
    { src, dst }
  );
  return rec.length ? rec[0].toObject() : null;
}

// READ: every road stored in Neo4j
export async function graphAllRoutes() {
  const rec = await runCypher(
    'MATCH (a:Mandi)-[r:ROUTE]->(b:Mandi) RETURN a.name AS source, b.name AS destination, r.distance AS distance, r.cost AS cost ORDER BY a.name, b.name'
  );
  return rec.map((r) => r.toObject());
}

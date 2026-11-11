
// lib/graph.js : all Neo4j queries in one place
import { runCypher } from './neo4j';
import { HttpError } from './errors';

// CREATE or UPDATE a farmer node and its NEAR links (near = [{ mandiId, distance }])
export async function graphSyncFarmer({ id, name, lat, lng, near }) {
    await runCypher(
      'MERGE (f:Farmer {id: toInteger($id)}) SET f.name = $name, f.lat = toFloat($lat), f.lng = toFloat($lng) ' +
        'WITH f OPTIONAL MATCH (f)-[old:NEAR]->() DELETE old ' +
        'WITH DISTINCT f UNWIND $near AS n MATCH (m:Mandi {id: toInteger(n.mandiId)}) ' +
        'MERGE (f)-[r:NEAR]->(m) SET r.distance = toFloat(n.distance), r.open = true',
      { id, name, lat, lng, near });
}

// DELETE a farmer node
export async function graphDeleteFarmer(id) {
  await runCypher('MATCH (f:Farmer {id: toInteger($id)}) DETACH DELETE f', { id });
}

// READ: shortest distance in km from a farmer to EVERY mandi, through open roads only
export async function graphFarmerDistances(id) {
  const rec = await runCypher(
        'MATCH p = (f:Farmer {id: toInteger($id)})-[:NEAR|ROUTE*1..6]->(m:Mandi) ' +
        'WHERE all(r IN relationships(p) WHERE r.open = true) ' +
        'WITH m, reduce(d = 0.0, r IN relationships(p) | d + r.distance) AS dist ' +
        'RETURN m.id AS mandiId, m.name AS mandi, min(dist) AS distance',
        { id });
    return rec.map((r) => r.toObject());
}

// UPDATE a road: new distance and/or open or closed
export async function graphSetRoad({ src, dst, distance, open }) {
  const rec = await runCypher(
        'MATCH (:Mandi {id: toInteger($src)})-[r:ROUTE]->(:Mandi {id: toInteger($dst)}) ' +
        'SET r.distance = toFloat($distance), r.cost = toFloat($cost), r.open = $open RETURN count(r) AS n',
        { src, dst, distance, cost: Math.round(distance * 1.5), open });
  if (rec[0].get('n') === 0) throw new HttpError(409, 'Road missing in Neo4j. Run npm run graph:sync to re-align the graph with MySQL.');
}

// DELETE a road
export async function graphDeleteRoad({ src, dst }) {
  await runCypher('MATCH (:Mandi {id: toInteger($src)})-[r:ROUTE]->(:Mandi {id: toInteger($dst)}) DELETE r', { src, dst });
}

// READ: cheapest mandi-to-mandi route by cost over open roads (at most 6 roads)
export async function graphCheapest(src, dst) {
  const rec = await runCypher(
        'MATCH p = (a:Mandi {id: toInteger($src)})-[:ROUTE*1..6]->(b:Mandi {id: toInteger($dst)}) ' +
        'WHERE all(r IN relationships(p) WHERE r.open = true) ' +
        'WITH p, reduce(c = 0.0, r IN relationships(p) | c + r.cost) AS totalCost, ' +
        'reduce(k = 0.0, r IN relationships(p) | k + r.distance) AS totalDistance ' +
        'RETURN [n IN nodes(p) | n.name] AS route, totalCost, totalDistance ' +
        'ORDER BY totalCost ASC, totalDistance ASC LIMIT 1',
        { src, dst });
    return rec.length ? rec[0].toObject() : null;
}

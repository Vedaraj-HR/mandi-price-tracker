
import mysql from 'mysql2/promise';
import neo4j from 'neo4j-driver';

const env = process.env;
const db = await mysql.createConnection({
  host: env.MYSQL_HOST, port: Number(env.MYSQL_PORT || 3306),
  user: 'root', password: env.MYSQL_ROOT_PASSWORD, database: env.MYSQL_DATABASE, decimalNumbers: true,
});
const [mandis] = await db.query('SELECT mandi_id AS id, name, location FROM mandi');
const [roads] = await db.query('SELECT source_mandi_id AS s, destination_mandi_id AS d, distance, cost FROM transports');

const driver = neo4j.driver(env.NEO4J_URI,
  neo4j.auth.basic(env.NEO4J_USERNAME, env.NEO4J_PASSWORD), {
  disableLosslessIntegers: true });
const session = driver.session();
try {
  await session.run('CREATE CONSTRAINT mandi_id_unique IF NOT EXISTS FOR (m:Mandi) REQUIRE m.id IS UNIQUE');
  await session.run('CREATE INDEX route_cost_index IF NOT EXISTS FOR ()-[r:ROUTE]-() ON (r.cost)');
  await session.run('MATCH (n:Mandi) DETACH DELETE n');
  await session.run('UNWIND $rows AS r CREATE (:Mandi {id: toInteger(r.id), name: r.name, location: r.location})', { rows: mandis });
  await session.run('UNWIND $rows AS r MATCH (a:Mandi {id: toInteger(r.s)}), (b:Mandi {id: toInteger(r.d)}) CREATE (a)-[:ROUTE {distance: toFloat(r.distance), cost: toFloat(r.cost)}]->(b)', { rows: roads });
  const res = await session.run('MATCH (m:Mandi) OPTIONAL MATCH (m)-[r:ROUTE]->() RETURN count(DISTINCT m) AS mandis, count(r) AS routes');
  console.log('Neo4j now holds', res.records[0].toObject());
} finally {
  await session.close();
  await driver.close();
}

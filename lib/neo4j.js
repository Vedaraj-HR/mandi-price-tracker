
import neo4j from 'neo4j-driver';

function driver() {
  globalThis.mandiNeo4j ??= neo4j.driver(
    process.env.NEO4J_URI,
    neo4j.auth.basic(process.env.NEO4J_USERNAME, process.env.NEO4J_PASSWORD),
    { disableLosslessIntegers: true }
  );
  return globalThis.mandiNeo4j;
}

export async function runCypher(query, params = {}) {
  const session = driver().session();
  try {
    const result = await session.run(query, params);
    return result.records;
  } finally {
    await session.close();
  }
}

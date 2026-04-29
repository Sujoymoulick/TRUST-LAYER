import neo4j, { Driver } from 'neo4j-driver';

let driver: Driver;

/**
 * Get or initialize the Neo4j Driver
 */
export const getNeo4jDriver = () => {
  if (driver) return driver;

  const uri = import.meta.env.VITE_NEO4J_URI || '';
  const user = import.meta.env.VITE_NEO4J_USER || '';
  const password = import.meta.env.VITE_NEO4J_PASSWORD || '';

  if (!uri || !user || !password) {
    console.warn('Neo4j credentials missing. Graph features will be disabled.');
  }

  driver = neo4j.driver(uri, neo4j.auth.basic(user, password));
  return driver;
};

/**
 * Execute a Cypher query with parameters
 */
export const runCypher = async (query: string, params: Record<string, any> = {}) => {
  const driver = getNeo4jDriver();
  const session = driver.session();
  try {
    const result = await session.run(query, params);
    return result.records;
  } finally {
    await session.close();
  }
};

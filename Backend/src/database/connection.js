const { Pool } = require("pg");

function buildPoolConfig({
  connectionString,
  host,
  port,
  user,
  password,
  database,
  min = 2,
  max = 10,
}) {
  if (connectionString) {
    return {
      connectionString,
      min,
      max,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    };
  }

  return {
    host,
    port,
    user,
    password,
    database,
    min,
    max,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  };
}

function createDatabaseConnection(options) {
  const pool = new Pool(buildPoolConfig(options));

  pool.on("error", (error) => {
    console.error("Unexpected PostgreSQL pool error:", error);
  });

  return {
    pool,
    async connect() {
      const client = await pool.connect();
      client.release();
      return true;
    },
    async getClient() {
      return pool.connect();
    },
    async query(text, params) {
      return pool.query(text, params);
    },
    async ping() {
      const result = await pool.query("SELECT NOW() AS connected_at");
      return {
        status: "ok",
        connectedAt: result.rows[0].connected_at,
      };
    },
    getPoolStats() {
      return {
        totalCount: pool.totalCount,
        idleCount: pool.idleCount,
        waitingCount: pool.waitingCount,
      };
    },
    async close() {
      await pool.end();
    },
  };
}

module.exports = { buildPoolConfig, createDatabaseConnection };

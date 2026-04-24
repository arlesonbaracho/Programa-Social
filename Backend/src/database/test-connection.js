const { loadEnv } = require("../config/env");
const { createDatabase } = require("../config/database");

async function testConnection() {
  const env = loadEnv();
  const database = createDatabase({
    connectionString: env.databaseUrl,
    ...env.databaseConfig,
  });

  await database.connect();
  const result = await database.ping();
  await database.close();

  console.log("Database connection successful:", result);
}

testConnection().catch((error) => {
  console.error("Database connection failed:", error.message);
  process.exit(1);
});

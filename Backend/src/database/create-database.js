const { Client } = require("pg");

const { loadEnv } = require("../config/env");

async function createDatabaseIfNotExists() {
  const env = loadEnv();
  const adminClient = new Client({
    host: env.databaseConfig.host,
    port: env.databaseConfig.port,
    user: env.databaseConfig.user,
    password: env.databaseConfig.password,
    database: env.databaseConfig.adminDatabase,
  });

  await adminClient.connect();

  const existingDatabase = await adminClient.query(
    "SELECT 1 FROM pg_database WHERE datname = $1",
    [env.databaseConfig.database],
  );

  if (existingDatabase.rowCount === 0) {
    const safeDatabaseName = env.databaseConfig.database.replace(/"/g, "\"\"");
    await adminClient.query(`CREATE DATABASE "${safeDatabaseName}"`);
    console.log(`Database ${env.databaseConfig.database} created successfully.`);
  } else {
    console.log(`Database ${env.databaseConfig.database} already exists.`);
  }

  await adminClient.end();
}

createDatabaseIfNotExists().catch((error) => {
  console.error("Failed to create database:", error.message);
  process.exit(1);
});

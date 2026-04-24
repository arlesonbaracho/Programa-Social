const fs = require("fs/promises");
const path = require("path");

const { loadEnv } = require("../config/env");
const { createDatabase } = require("../config/database");

async function migrate() {
  const env = loadEnv();
  const database = createDatabase({
    connectionString: env.databaseUrl,
    ...env.databaseConfig,
  });
  const schemaPath = path.resolve(
    __dirname,
    "../../database/schema_banco_dados.sql",
  );
  const schemaSql = await fs.readFile(schemaPath, "utf8");

  await database.connect();
  await database.query(schemaSql);
  await database.close();

  console.log("Database schema applied successfully.");
}

migrate().catch((error) => {
  console.error("Migration failed:", error);
  process.exit(1);
});

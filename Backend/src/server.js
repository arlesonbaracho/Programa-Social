const { createApp } = require("./app");
const { loadEnv } = require("./config/env");
const { createDatabase } = require("./config/database");
const { buildDependencies } = require("./container");

async function startServer() {
  const env = loadEnv();
  const database = createDatabase({
    connectionString: env.databaseUrl,
    ...env.databaseConfig,
  });

  await database.connect();

  const dependencies = buildDependencies({ env, database });
  const app = createApp(dependencies);

  const server = app.listen(env.port, env.host, () => {
    console.log(
      `${env.appName} backend listening on ${env.host}:${env.port} in ${env.nodeEnv} mode.`,
    );
  });

  const shutdown = async () => {
    server.close(async () => {
      await database.close();
      process.exit(0);
    });
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

startServer().catch((error) => {
  console.error("Failed to start backend:", error);
  process.exit(1);
});

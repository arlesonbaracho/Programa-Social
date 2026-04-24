const { loadEnv } = require("../config/env");
const { createDatabase } = require("../config/database");
const { buildDependencies } = require("../container");

async function processNotifications() {
  const env = loadEnv();
  const database = createDatabase({
    connectionString: env.databaseUrl,
    ...env.databaseConfig,
  });

  await database.connect();
  const dependencies = buildDependencies({ env, database });

  const closing = await dependencies.notificationService.processClosingReminders();
  const starting = await dependencies.notificationService.processProgramStartingNotifications();
  const delivered = await dependencies.notificationService.flushPendingNotifications();

  await database.close();

  console.log(
    `Notifications processed. queuedClosing=${closing.length} queuedStarting=${starting.length} delivered=${delivered.length}`,
  );
}

processNotifications().catch((error) => {
  console.error("Failed to process notifications:", error);
  process.exit(1);
});

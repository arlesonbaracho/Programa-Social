function createHealthService({ appName, envName, database }) {
  return {
    async getStatus() {
      return {
        name: appName,
        environment: envName,
        status: "ok",
        timestamp: new Date().toISOString(),
      };
    },
    async getDatabaseStatus() {
      const pingResult = await database.ping();

      return {
        status: pingResult.status,
        checkedAt: new Date().toISOString(),
      };
    },
  };
}

module.exports = { createHealthService };

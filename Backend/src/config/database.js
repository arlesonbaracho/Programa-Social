const { createDatabaseConnection } = require("../database/connection");

function createDatabase(options) {
  return createDatabaseConnection(options);
}

module.exports = { createDatabase };

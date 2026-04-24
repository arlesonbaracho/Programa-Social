const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

const { buildApiRouter } = require("./routes");
const { notFoundHandler } = require("./middlewares/not-found");
const { errorHandler } = require("./middlewares/error-handler");

function createApp(dependencies = {}) {
  const app = express();

  app.use(helmet());
  app.use(cors());
  app.use(express.json());
  app.use(morgan("dev"));

  app.use("/api", buildApiRouter(dependencies));
  app.use("/api/v1", buildApiRouter(dependencies));

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

module.exports = { createApp };

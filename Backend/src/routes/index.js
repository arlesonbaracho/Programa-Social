const express = require("express");

const { buildAuthRouter } = require("./auth.routes");
const { buildProgramsRouter } = require("./programs.routes");
const { buildEnrollmentsRouter } = require("./enrollments.routes");
const { buildUsersRouter } = require("./users.routes");
const { buildNotificationsRouter } = require("./notifications.routes");
const { buildDocumentsRouter } = require("./documents.routes");
const { buildHealthRouter } = require("./health.routes");
const { buildCitizenRouter } = require("./citizens.routes");

function buildApiRouter(dependencies = {}) {
  const router = express.Router();

  router.use("/auth", buildAuthRouter(dependencies));
  router.use("/health", buildHealthRouter(dependencies));
  router.use("/programas", buildProgramsRouter(dependencies));
  router.use("/inscricoes", buildEnrollmentsRouter(dependencies));
  router.use("/usuarios", buildUsersRouter(dependencies));
  router.use("/notificacoes", buildNotificationsRouter(dependencies));
  router.use("/documentos", buildDocumentsRouter(dependencies));
  router.use("/citizens", buildCitizenRouter(dependencies));

  return router;
}

module.exports = { buildApiRouter };

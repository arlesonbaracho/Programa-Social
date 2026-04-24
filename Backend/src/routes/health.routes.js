const express = require("express");

function buildHealthRouter({ healthService }) {
  const router = express.Router();

  router.get("/", async (request, response, next) => {
    try {
      const payload = await healthService.getStatus();
      response.status(200).json(payload);
    } catch (error) {
      next(error);
    }
  });

  router.get("/database", async (request, response, next) => {
    try {
      const payload = await healthService.getDatabaseStatus();
      response.status(200).json(payload);
    } catch (error) {
      next(error);
    }
  });

  return router;
}

module.exports = { buildHealthRouter };

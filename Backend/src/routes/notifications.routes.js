const express = require("express");

const { authenticate } = require("../middlewares/authentication");

function buildNotificationsRouter({ notificationService }) {
  const router = express.Router();

  router.use(authenticate);

  router.get("/", async (request, response, next) => {
    try {
      const result = await notificationService.listMyNotifications(request.user);
      response.status(200).json(result);
    } catch (error) {
      next(error);
    }
  });

  router.get("/:id", async (request, response, next) => {
    try {
      const result = await notificationService.getNotificationById(request.params.id, request.user);
      response.status(200).json(result);
    } catch (error) {
      next(error);
    }
  });

  router.put("/:id/ler", async (request, response, next) => {
    try {
      const result = await notificationService.markAsRead(request.params.id, request.user);
      response.status(200).json(result);
    } catch (error) {
      next(error);
    }
  });

  return router;
}

module.exports = { buildNotificationsRouter };

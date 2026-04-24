const express = require("express");
const Joi = require("joi");

const { authenticate } = require("../middlewares/authentication");
const { requireRoles } = require("../middlewares/authorization");
const { validate } = require("../middlewares/validate");

const createEnrollmentSchema = Joi.object({
  programaId: Joi.string().guid({ version: "uuidv4" }).required(),
  respostasCriterios: Joi.object().default({}),
});

const rejectSchema = Joi.object({
  motivoRejeicao: Joi.string().min(3).max(1000).required(),
});

function buildEnrollmentsRouter({ enrollmentService }) {
  const router = express.Router();

  router.get("/", authenticate, async (request, response, next) => {
    try {
      const result = await enrollmentService.listMyEnrollments(request.user);
      response.status(200).json(result);
    } catch (error) {
      next(error);
    }
  });

  router.get("/:id", authenticate, async (request, response, next) => {
    try {
      const result = await enrollmentService.getEnrollmentById(request.params.id, request.user);
      response.status(200).json(result);
    } catch (error) {
      next(error);
    }
  });

  router.post(
    "/",
    authenticate,
    requireRoles(["participante"]),
    validate(createEnrollmentSchema),
    async (request, response, next) => {
      try {
        const result = await enrollmentService.createEnrollment(request.body, request.user);
        response.status(201).json(result);
      } catch (error) {
        next(error);
      }
    },
  );

  router.put(
    "/:id/aprovar",
    authenticate,
    requireRoles(["servidor", "gestor"]),
    async (request, response, next) => {
      try {
        const result = await enrollmentService.approveEnrollment(request.params.id, request.user);
        response.status(200).json(result);
      } catch (error) {
        next(error);
      }
    },
  );

  router.put(
    "/:id/rejeitar",
    authenticate,
    requireRoles(["servidor", "gestor"]),
    validate(rejectSchema),
    async (request, response, next) => {
      try {
        const result = await enrollmentService.rejectEnrollment(
          request.params.id,
          request.body,
          request.user,
        );
        response.status(200).json(result);
      } catch (error) {
        next(error);
      }
    },
  );

  router.delete("/:id", authenticate, async (request, response, next) => {
    try {
      const result = await enrollmentService.cancelEnrollment(request.params.id, request.user);
      response.status(200).json(result);
    } catch (error) {
      next(error);
    }
  });

  return router;
}

module.exports = { buildEnrollmentsRouter };

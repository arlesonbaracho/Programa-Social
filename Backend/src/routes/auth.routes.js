const express = require("express");
const Joi = require("joi");

const { authenticate } = require("../middlewares/authentication");
const { validate } = require("../middlewares/validate");

const registerSchema = Joi.object({
  nome: Joi.string().min(3).max(255).required(),
  email: Joi.string().email().required(),
  senha: Joi.string().min(6).max(100).required(),
  cpf: Joi.string().pattern(/^\d{11}$/).allow(null, ""),
  telefone: Joi.string().max(20).allow(null, ""),
  dataNascimento: Joi.date().iso().allow(null),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  senha: Joi.string().required(),
});

const refreshSchema = Joi.object({
  refreshToken: Joi.string().required(),
});

function buildAuthRouter({ authService }) {
  const router = express.Router();

  router.post("/registrar", validate(registerSchema), async (request, response, next) => {
    try {
      const result = await authService.register(request.body, {
        ipOrigem: request.ip,
        userAgent: request.get("user-agent"),
      });
      response.status(201).json(result);
    } catch (error) {
      next(error);
    }
  });

  router.post("/login", validate(loginSchema), async (request, response, next) => {
    try {
      const result = await authService.login(request.body, {
        ipOrigem: request.ip,
        userAgent: request.get("user-agent"),
      });
      response.status(200).json(result);
    } catch (error) {
      next(error);
    }
  });

  router.post("/refresh-token", validate(refreshSchema), async (request, response, next) => {
    try {
      const result = await authService.refreshToken(request.body.refreshToken, {
        ipOrigem: request.ip,
        userAgent: request.get("user-agent"),
      });
      response.status(200).json(result);
    } catch (error) {
      next(error);
    }
  });

  router.post(
    "/logout",
    authenticate,
    validate(refreshSchema),
    async (request, response, next) => {
      try {
        const result = await authService.logout(request.body.refreshToken);
        response.status(200).json(result);
      } catch (error) {
        next(error);
      }
    },
  );

  return router;
}

module.exports = { buildAuthRouter };

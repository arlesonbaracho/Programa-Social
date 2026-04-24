const express = require("express");
const Joi = require("joi");

const { authenticate } = require("../middlewares/authentication");
const { requireRoles } = require("../middlewares/authorization");
const { validate } = require("../middlewares/validate");

const updateProfileSchema = Joi.object({
  nome: Joi.string().max(255).allow(null, ""),
  telefone: Joi.string().max(20).allow(null, ""),
  dataNascimento: Joi.date().iso().allow(null),
  enderecoRua: Joi.string().max(255).allow(null, ""),
  enderecoNumero: Joi.string().max(10).allow(null, ""),
  enderecoComplemento: Joi.string().max(255).allow(null, ""),
  enderecoBairro: Joi.string().max(100).allow(null, ""),
  enderecoCidade: Joi.string().max(100).allow(null, ""),
  enderecoEstado: Joi.string().length(2).allow(null, ""),
  enderecoCep: Joi.string().pattern(/^\d{8}$/).allow(null, ""),
});

const updateStatusSchema = Joi.object({
  status: Joi.string().valid("ativo", "inativo", "suspenso").required(),
});

function buildUsersRouter({ userService }) {
  const router = express.Router();

  router.get("/perfil", authenticate, async (request, response, next) => {
    try {
      const result = await userService.getProfile(request.user.id);
      response.status(200).json(result);
    } catch (error) {
      next(error);
    }
  });

  router.put("/perfil", authenticate, validate(updateProfileSchema), async (request, response, next) => {
    try {
      const result = await userService.updateProfile(request.user.id, request.body);
      response.status(200).json(result);
    } catch (error) {
      next(error);
    }
  });

  router.get("/", authenticate, requireRoles(["gestor"]), async (request, response, next) => {
    try {
      const result = await userService.listUsers(request.query);
      response.status(200).json(result);
    } catch (error) {
      next(error);
    }
  });

  router.put(
    "/:id/status",
    authenticate,
    requireRoles(["gestor"]),
    validate(updateStatusSchema),
    async (request, response, next) => {
      try {
        const result = await userService.updateStatus(request.params.id, request.body.status);
        response.status(200).json(result);
      } catch (error) {
        next(error);
      }
    },
  );

  return router;
}

module.exports = { buildUsersRouter };

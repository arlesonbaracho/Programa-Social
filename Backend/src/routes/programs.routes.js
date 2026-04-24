const express = require("express");
const Joi = require("joi");

const { authenticate } = require("../middlewares/authentication");
const { requireRoles } = require("../middlewares/authorization");
const { validate } = require("../middlewares/validate");

const criteriaSchema = Joi.object({
  nome: Joi.string().max(255).required(),
  descricao: Joi.string().allow(null, ""),
  tipo: Joi.string()
    .valid("idade", "renda", "documento", "residencia", "escolaridade", "outro")
    .required(),
  valorMinimo: Joi.string().allow(null, ""),
  valorMaximo: Joi.string().allow(null, ""),
  obrigatorio: Joi.boolean().default(true),
  permiteMultiplasRespostas: Joi.boolean().default(false),
  ordem: Joi.number().integer().min(0).default(0),
});

const programSchema = Joi.object({
  nome: Joi.string().max(255).required(),
  descricao: Joi.string().allow(null, ""),
  objetivo: Joi.string().allow(null, ""),
  publicoAlvo: Joi.string().allow(null, ""),
  tipo: Joi.string()
    .valid("educacao", "saude", "assistencia", "cultura", "outro")
    .required(),
  dataInicioInscricao: Joi.date().iso().required(),
  dataFimInscricao: Joi.date().iso().required(),
  dataInicioPrograma: Joi.date().iso().required(),
  dataFimPrograma: Joi.date().iso().required(),
  totalVagas: Joi.number().integer().min(1).required(),
  tipoInscricao: Joi.string().valid("automatica", "manual").required(),
  localRealizacao: Joi.string().allow(null, ""),
  enderecoRealizacao: Joi.string().allow(null, ""),
  responsavelNome: Joi.string().allow(null, ""),
  responsavelContato: Joi.string().allow(null, ""),
  criterios: Joi.array().items(criteriaSchema).default([]),
});

function buildProgramsRouter({ programService }) {
  const router = express.Router();

  router.get("/", async (request, response, next) => {
    try {
      const result = await programService.listPrograms(request.query);
      response.status(200).json(result);
    } catch (error) {
      next(error);
    }
  });

  router.get("/:id", async (request, response, next) => {
    try {
      const result = await programService.getProgramById(request.params.id);
      response.status(200).json(result);
    } catch (error) {
      next(error);
    }
  });

  router.post(
    "/",
    authenticate,
    requireRoles(["gestor"]),
    validate(programSchema),
    async (request, response, next) => {
      try {
        const result = await programService.createProgram(request.body, request.user);
        response.status(201).json(result);
      } catch (error) {
        next(error);
      }
    },
  );

  router.put(
    "/:id",
    authenticate,
    requireRoles(["gestor"]),
    validate(programSchema),
    async (request, response, next) => {
      try {
        const result = await programService.updateProgram(request.params.id, request.body);
        response.status(200).json(result);
      } catch (error) {
        next(error);
      }
    },
  );

  router.delete("/:id", authenticate, requireRoles(["gestor"]), async (request, response, next) => {
    try {
      const result = await programService.deleteProgram(request.params.id);
      response.status(200).json(result);
    } catch (error) {
      next(error);
    }
  });

  router.get(
    "/:id/inscricoes",
    authenticate,
    requireRoles(["gestor", "servidor"]),
    async (request, response, next) => {
      try {
        const result = await programService.listProgramEnrollments(request.params.id);
        response.status(200).json(result);
      } catch (error) {
        next(error);
      }
    },
  );

  return router;
}

module.exports = { buildProgramsRouter };

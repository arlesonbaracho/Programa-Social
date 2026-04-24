const express = require("express");
const Joi = require("joi");

const { authenticate } = require("../middlewares/authentication");
const { validate } = require("../middlewares/validate");

const uploadSchema = Joi.object({
  inscricaoId: Joi.string().guid({ version: "uuidv4" }).allow(null),
  tipo: Joi.string()
    .valid(
      "cpf",
      "rg",
      "comprovante_renda",
      "comprovante_residencia",
      "comprovante_escolaridade",
      "outro",
    )
    .required(),
  arquivoUrl: Joi.string().max(255).required(),
  nomeArquivo: Joi.string().max(255).required(),
  tamanhoBytes: Joi.number().integer().min(0).allow(null),
  mimeType: Joi.string().max(100).allow(null, ""),
  dataExpiracao: Joi.date().iso().allow(null),
});

function buildDocumentsRouter({ documentService }) {
  const router = express.Router();

  router.post("/upload", authenticate, validate(uploadSchema), async (request, response, next) => {
    try {
      const result = await documentService.uploadDocument(request.body, request.user);
      response.status(201).json(result);
    } catch (error) {
      next(error);
    }
  });

  router.get("/:id", authenticate, async (request, response, next) => {
    try {
      const result = await documentService.getDocumentById(request.params.id, request.user);
      response.status(200).json(result);
    } catch (error) {
      next(error);
    }
  });

  router.delete("/:id", authenticate, async (request, response, next) => {
    try {
      const result = await documentService.deleteDocument(request.params.id, request.user);
      response.status(200).json(result);
    } catch (error) {
      next(error);
    }
  });

  return router;
}

module.exports = { buildDocumentsRouter };

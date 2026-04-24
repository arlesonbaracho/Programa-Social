const express = require("express");
const Joi = require("joi");

const createCitizenSchema = Joi.object({
  fullName: Joi.string().min(3).max(160).required(),
  cpf: Joi.string().pattern(/^\d{11}$/).required(),
  nis: Joi.string().pattern(/^\d{11}$/).allow(null, ""),
  email: Joi.string().email().allow(null, ""),
  phone: Joi.string().max(20).allow(null, ""),
  familyIncome: Joi.number().min(0).required(),
  householdSize: Joi.number().integer().min(1).required(),
  areaType: Joi.string().valid("URBAN", "RURAL").required(),
  street: Joi.string().max(160).required(),
  number: Joi.string().max(20).allow(null, ""),
  neighborhood: Joi.string().max(120).required(),
  city: Joi.string().max(120).required(),
  state: Joi.string().length(2).required(),
  postalCode: Joi.string().pattern(/^\d{8}$/).allow(null, ""),
  notes: Joi.string().max(1000).allow(null, ""),
  createdByUserId: Joi.string().guid({ version: "uuidv4" }).allow(null),
});

function buildCitizenRouter({ citizenService }) {
  const router = express.Router();

  router.post("/", async (request, response, next) => {
    try {
      const payload = await createCitizenSchema.validateAsync(request.body, {
        abortEarly: false,
        stripUnknown: true,
      });

      const citizen = await citizenService.createCitizen(payload);
      response.status(201).json(citizen);
    } catch (error) {
      next(error);
    }
  });

  return router;
}

module.exports = { buildCitizenRouter };

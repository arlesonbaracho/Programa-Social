const Joi = require("joi");
const { AppError } = require("../utils/errors");

function errorHandler(error, request, response, next) {
  if (response.headersSent) {
    return next(error);
  }

  if (Joi.isError(error)) {
    return response.status(400).json({
      message: "Validation failed.",
      details: error.details.map((detail) => detail.message),
    });
  }

  if (error.code === "23505") {
    return response.status(409).json({
      message: "A record with the same unique data already exists.",
      detail: error.detail,
    });
  }

  if (error instanceof AppError) {
    return response.status(error.statusCode).json({
      message: error.message,
      details: error.details,
    });
  }

  return response.status(500).json({
    message: "Internal server error.",
    detail:
      process.env.NODE_ENV === "production" ? undefined : error.message,
  });
}

module.exports = { errorHandler };

function validate(schema, target = "body") {
  return async (request, response, next) => {
    try {
      const value = await schema.validateAsync(request[target], {
        abortEarly: false,
        stripUnknown: true,
      });

      request[target] = value;
      next();
    } catch (error) {
      next(error);
    }
  };
}

module.exports = { validate };

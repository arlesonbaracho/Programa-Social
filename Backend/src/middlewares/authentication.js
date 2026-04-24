const jwt = require("jsonwebtoken");

const { loadEnv } = require("../config/env");
const { UnauthorizedError } = require("../utils/errors");

function authenticate(request, response, next) {
  try {
    const header = request.headers.authorization;
    if (!header) {
      throw new UnauthorizedError("Authorization header not provided.");
    }

    const [scheme, token] = header.split(" ");
    if (scheme !== "Bearer" || !token) {
      throw new UnauthorizedError("Invalid authorization header format.");
    }

    const env = loadEnv();
    const payload = jwt.verify(token, env.jwtSecret);

    request.user = {
      id: payload.sub,
      email: payload.email,
      nome: payload.nome,
      tipo: payload.tipo,
    };

    next();
  } catch (error) {
    if (
      error.name === "TokenExpiredError" ||
      error.name === "JsonWebTokenError"
    ) {
      next(new UnauthorizedError("Invalid or expired token."));
      return;
    }

    next(error);
  }
}

module.exports = { authenticate };

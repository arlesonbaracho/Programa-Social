const { ForbiddenError, UnauthorizedError } = require("../utils/errors");

function requireRoles(roles = []) {
  return (request, response, next) => {
    if (!request.user) {
      next(new UnauthorizedError("Authentication required."));
      return;
    }

    if (!roles.includes(request.user.tipo)) {
      next(new ForbiddenError("User does not have the required role."));
      return;
    }

    next();
  };
}

module.exports = { requireRoles };

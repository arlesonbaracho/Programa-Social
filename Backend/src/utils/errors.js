class AppError extends Error {
  constructor(message, statusCode = 500, details) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.details = details;
  }
}

class BadRequestError extends AppError {
  constructor(message, details) {
    super(message, 400, details);
  }
}

class UnauthorizedError extends AppError {
  constructor(message = "Authentication required.") {
    super(message, 401);
  }
}

class ForbiddenError extends AppError {
  constructor(message = "You do not have permission to access this resource.") {
    super(message, 403);
  }
}

class NotFoundError extends AppError {
  constructor(message = "Resource not found.") {
    super(message, 404);
  }
}

class ConflictError extends AppError {
  constructor(message, details) {
    super(message, 409, details);
  }
}

module.exports = {
  AppError,
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
};

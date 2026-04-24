const { NotFoundError } = require("../utils/errors");

function sanitizeUser(user) {
  if (!user) {
    return null;
  }

  const { senhaHash, ...safeUser } = user;
  return safeUser;
}

function createUserService({ userRepository }) {
  return {
    async getProfile(userId) {
      const user = await userRepository.findById(userId);
      if (!user) {
        throw new NotFoundError("Usuario nao encontrado.");
      }
      return sanitizeUser(user);
    },

    async updateProfile(userId, payload) {
      const user = await userRepository.updateProfile(userId, payload);
      if (!user) {
        throw new NotFoundError("Usuario nao encontrado.");
      }
      return sanitizeUser(user);
    },

    async listUsers(filters) {
      const users = await userRepository.list(filters);
      return users.map(sanitizeUser);
    },

    async updateStatus(id, status) {
      const user = await userRepository.updateStatus(id, status);
      if (!user) {
        throw new NotFoundError("Usuario nao encontrado.");
      }
      return sanitizeUser(user);
    },
  };
}

module.exports = { createUserService };

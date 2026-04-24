const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const { isValidCpf } = require("../utils/cpf");
const {
  BadRequestError,
  ConflictError,
  NotFoundError,
  UnauthorizedError,
} = require("../utils/errors");

function sanitizeUser(user) {
  if (!user) {
    return null;
  }

  const { senhaHash, ...safeUser } = user;
  return safeUser;
}

function parseExpirationToDate(duration) {
  const now = new Date();
  const match = /^(\d+)([smhd])$/.exec(duration);
  if (!match) {
    now.setDate(now.getDate() + 7);
    return now;
  }

  const amount = Number(match[1]);
  const unit = match[2];
  const multipliers = {
    s: 1000,
    m: 60000,
    h: 3600000,
    d: 86400000,
  };

  return new Date(Date.now() + amount * multipliers[unit]);
}

function createAuthService({
  userRepository,
  sessionRepository,
  jwtSecret,
  jwtRefreshSecret,
  jwtExpiration,
  jwtRefreshExpiration,
  bcryptRounds,
}) {
  function generateTokens(user) {
    const accessToken = jwt.sign(
      {
        sub: user.id,
        email: user.email,
        nome: user.nome,
        tipo: user.tipo,
      },
      jwtSecret,
      { expiresIn: jwtExpiration },
    );

    const refreshToken = jwt.sign(
      {
        sub: user.id,
        tipo: user.tipo,
      },
      jwtRefreshSecret,
      { expiresIn: jwtRefreshExpiration },
    );

    return {
      accessToken,
      refreshToken,
      expiresIn: jwtExpiration,
    };
  }

  return {
    async register(payload, metadata = {}) {
      if (payload.cpf && !isValidCpf(payload.cpf)) {
        throw new BadRequestError("CPF invalido.");
      }

      const existingUser = await userRepository.findByEmail(payload.email);
      if (existingUser) {
        throw new ConflictError("Ja existe um usuario com este email.");
      }

      const senhaHash = await bcrypt.hash(payload.senha, bcryptRounds);
      const user = await userRepository.create({
        ...payload,
        senhaHash,
        tipo: payload.tipo || "participante",
        status: "ativo",
      });

      const tokens = generateTokens(user);
      await sessionRepository.create({
        usuarioId: user.id,
        tokenRefresh: tokens.refreshToken,
        ipOrigem: metadata.ipOrigem,
        userAgent: metadata.userAgent,
        dataExpiracao: parseExpirationToDate(jwtRefreshExpiration),
      });

      return {
        user: sanitizeUser(user),
        tokens,
      };
    },

    async login(payload, metadata = {}) {
      const user = await userRepository.findByEmail(payload.email);
      if (!user) {
        throw new UnauthorizedError("Credenciais invalidas.");
      }

      const senhaCorreta = await bcrypt.compare(payload.senha, user.senhaHash);
      if (!senhaCorreta) {
        throw new UnauthorizedError("Credenciais invalidas.");
      }

      if (user.status !== "ativo") {
        throw new UnauthorizedError("Usuario inativo ou suspenso.");
      }

      const tokens = generateTokens(user);
      await sessionRepository.deleteByUserId(user.id);
      await sessionRepository.create({
        usuarioId: user.id,
        tokenRefresh: tokens.refreshToken,
        ipOrigem: metadata.ipOrigem,
        userAgent: metadata.userAgent,
        dataExpiracao: parseExpirationToDate(jwtRefreshExpiration),
      });
      await userRepository.touchLastAccess(user.id);

      return {
        user: sanitizeUser(user),
        tokens,
      };
    },

    async refreshToken(refreshToken, metadata = {}) {
      const session = await sessionRepository.findByToken(refreshToken);
      if (!session) {
        throw new UnauthorizedError("Refresh token invalido.");
      }

      try {
        const payload = jwt.verify(refreshToken, jwtRefreshSecret);
        const user = await userRepository.findById(payload.sub);
        if (!user) {
          throw new NotFoundError("Usuario nao encontrado.");
        }

        const tokens = generateTokens(user);
        await sessionRepository.deleteByToken(refreshToken);
        await sessionRepository.create({
          usuarioId: user.id,
          tokenRefresh: tokens.refreshToken,
          ipOrigem: metadata.ipOrigem,
          userAgent: metadata.userAgent,
          dataExpiracao: parseExpirationToDate(jwtRefreshExpiration),
        });

        return {
          user: sanitizeUser(user),
          tokens,
        };
      } catch (error) {
        throw new UnauthorizedError("Refresh token invalido ou expirado.");
      }
    },

    async logout(refreshToken) {
      await sessionRepository.deleteByToken(refreshToken);
      return { success: true };
    },
  };
}

module.exports = { createAuthService };

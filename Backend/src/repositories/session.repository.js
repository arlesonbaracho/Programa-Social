function buildExecutor(db, executor) {
  return executor || db;
}

function mapSession(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    usuarioId: row.usuario_id,
    tokenRefresh: row.token_refresh,
    ipOrigem: row.ip_origem,
    userAgent: row.user_agent,
    dataCriacao: row.data_criacao,
    dataExpiracao: row.data_expiracao,
  };
}

function createSessionRepository({ db }) {
  return {
    async create(payload, executor) {
      const runner = buildExecutor(db, executor);
      const result = await runner.query(
        `
          INSERT INTO sessoes (usuario_id, token_refresh, ip_origem, user_agent, data_expiracao)
          VALUES ($1, $2, $3, $4, $5)
          RETURNING *
        `,
        [
          payload.usuarioId,
          payload.tokenRefresh,
          payload.ipOrigem || null,
          payload.userAgent || null,
          payload.dataExpiracao,
        ],
      );
      return mapSession(result.rows[0]);
    },

    async findByToken(token, executor) {
      const runner = buildExecutor(db, executor);
      const result = await runner.query(
        "SELECT * FROM sessoes WHERE token_refresh = $1 LIMIT 1",
        [token],
      );
      return mapSession(result.rows[0]);
    },

    async deleteByToken(token, executor) {
      const runner = buildExecutor(db, executor);
      const result = await runner.query(
        "DELETE FROM sessoes WHERE token_refresh = $1",
        [token],
      );
      return result.rowCount > 0;
    },

    async deleteByUserId(usuarioId, executor) {
      const runner = buildExecutor(db, executor);
      await runner.query("DELETE FROM sessoes WHERE usuario_id = $1", [usuarioId]);
    },
  };
}

module.exports = { createSessionRepository };

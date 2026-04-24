const BaseModel = require("./BaseModel");

class Sessao extends BaseModel {
  constructor(db) {
    super(db, "sessoes");
  }

  async create(data) {
    const result = await this.db.query(
      `
        INSERT INTO sessoes (
          usuario_id,
          token_refresh,
          ip_origem,
          user_agent,
          data_expiracao
        )
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `,
      [
        data.usuarioId,
        data.tokenRefresh,
        data.ipOrigem || null,
        data.userAgent || null,
        data.dataExpiracao,
      ],
    );

    return result.rows[0];
  }

  async findByRefreshToken(tokenRefresh) {
    const result = await this.db.query(
      "SELECT * FROM sessoes WHERE token_refresh = $1 LIMIT 1",
      [tokenRefresh],
    );

    return result.rows[0] || null;
  }

  async deleteExpired() {
    const result = await this.db.query(
      "DELETE FROM sessoes WHERE data_expiracao < CURRENT_TIMESTAMP",
    );

    return result.rowCount;
  }
}

module.exports = Sessao;

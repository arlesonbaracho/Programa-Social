const BaseModel = require("./BaseModel");

class Notificacao extends BaseModel {
  constructor(db) {
    super(db, "notificacoes");
  }

  async create(data) {
    const result = await this.db.query(
      `
        INSERT INTO notificacoes (
          usuario_id,
          tipo,
          titulo,
          mensagem,
          programa_id,
          inscricao_id
        )
        VALUES ($1, $2::tipo_notificacao, $3, $4, $5, $6)
        RETURNING *
      `,
      [
        data.usuarioId,
        data.tipo,
        data.titulo,
        data.mensagem || null,
        data.programaId || null,
        data.inscricaoId || null,
      ],
    );

    return result.rows[0];
  }

  async listUnreadByUsuarioId(usuarioId) {
    const result = await this.db.query(
      `
        SELECT *
        FROM notificacoes
        WHERE usuario_id = $1 AND lido = FALSE
        ORDER BY data_criacao DESC
      `,
      [usuarioId],
    );

    return result.rows;
  }

  async markAsRead(id) {
    const result = await this.db.query(
      `
        UPDATE notificacoes
        SET lido = TRUE, data_leitura = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING *
      `,
      [id],
    );

    return result.rows[0] || null;
  }
}

module.exports = Notificacao;

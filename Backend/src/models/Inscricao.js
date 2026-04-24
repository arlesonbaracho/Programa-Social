const BaseModel = require("./BaseModel");

class Inscricao extends BaseModel {
  constructor(db) {
    super(db, "inscricoes");
  }

  async create(data) {
    const result = await this.db.query(
      `
        INSERT INTO inscricoes (
          usuario_id,
          programa_id,
          status,
          respostas_criterios,
          servidor_responsavel_id
        )
        VALUES ($1, $2, $3::status_inscricao, $4::jsonb, $5)
        RETURNING *
      `,
      [
        data.usuarioId,
        data.programaId,
        data.status || "pendente",
        JSON.stringify(data.respostasCriterios || {}),
        data.servidorResponsavelId || null,
      ],
    );

    return result.rows[0];
  }

  async findByUsuarioId(usuarioId) {
    const result = await this.db.query(
      "SELECT * FROM inscricoes WHERE usuario_id = $1 ORDER BY data_inscricao DESC",
      [usuarioId],
    );

    return result.rows;
  }

  async updateStatus(id, status, motivoRejeicao = null, servidorResponsavelId = null) {
    const result = await this.db.query(
      `
        UPDATE inscricoes
        SET
          status = $2::status_inscricao,
          motivo_rejeicao = $3,
          servidor_responsavel_id = COALESCE($4, servidor_responsavel_id),
          data_aprovacao = CASE WHEN $2 = 'aprovada' THEN CURRENT_TIMESTAMP ELSE data_aprovacao END,
          data_rejeicao = CASE WHEN $2 = 'rejeitada' THEN CURRENT_TIMESTAMP ELSE data_rejeicao END
        WHERE id = $1
        RETURNING *
      `,
      [id, status, motivoRejeicao, servidorResponsavelId],
    );

    return result.rows[0] || null;
  }
}

module.exports = Inscricao;

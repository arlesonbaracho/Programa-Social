function buildExecutor(db, executor) {
  return executor || db;
}

function mapEnrollment(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    usuarioId: row.usuario_id,
    programaId: row.programa_id,
    status: row.status,
    respostasCriterios: row.respostas_criterios,
    motivoRejeicao: row.motivo_rejeicao,
    servidorResponsavelId: row.servidor_responsavel_id,
    dataInscricao: row.data_inscricao,
    dataAprovacao: row.data_aprovacao,
    dataRejeicao: row.data_rejeicao,
    compareceu: row.compareceu,
    dataParticipacao: row.data_participacao,
    observacoesParticipacao: row.observacoes_participacao,
  };
}

function createEnrollmentRepository({ db }) {
  return {
    async create(payload, executor) {
      const runner = buildExecutor(db, executor);
      const result = await runner.query(
        `
          INSERT INTO inscricoes (
            usuario_id, programa_id, status, respostas_criterios,
            motivo_rejeicao, servidor_responsavel_id, data_aprovacao, data_rejeicao
          )
          VALUES (
            $1, $2, $3::status_inscricao, $4::jsonb,
            $5, $6,
            CASE WHEN $3 = 'aprovada' THEN CURRENT_TIMESTAMP ELSE NULL END,
            CASE WHEN $3 = 'rejeitada' THEN CURRENT_TIMESTAMP ELSE NULL END
          )
          RETURNING *
        `,
        [
          payload.usuarioId,
          payload.programaId,
          payload.status,
          JSON.stringify(payload.respostasCriterios || {}),
          payload.motivoRejeicao || null,
          payload.servidorResponsavelId || null,
        ],
      );
      return mapEnrollment(result.rows[0]);
    },

    async findById(id, executor) {
      const runner = buildExecutor(db, executor);
      const result = await runner.query(
        "SELECT * FROM inscricoes WHERE id = $1 LIMIT 1",
        [id],
      );
      return mapEnrollment(result.rows[0]);
    },

    async findByUserAndProgram(usuarioId, programaId, executor) {
      const runner = buildExecutor(db, executor);
      const result = await runner.query(
        `
          SELECT *
          FROM inscricoes
          WHERE usuario_id = $1 AND programa_id = $2
          LIMIT 1
        `,
        [usuarioId, programaId],
      );
      return mapEnrollment(result.rows[0]);
    },

    async listByUserId(usuarioId, executor) {
      const runner = buildExecutor(db, executor);
      const result = await runner.query(
        `
          SELECT *
          FROM inscricoes
          WHERE usuario_id = $1
          ORDER BY data_inscricao DESC
        `,
        [usuarioId],
      );
      return result.rows.map(mapEnrollment);
    },

    async listByProgramId(programaId, executor) {
      const runner = buildExecutor(db, executor);
      const result = await runner.query(
        `
          SELECT *
          FROM inscricoes
          WHERE programa_id = $1
          ORDER BY data_inscricao DESC
        `,
        [programaId],
      );
      return result.rows.map(mapEnrollment);
    },

    async updateStatus(id, payload, executor) {
      const runner = buildExecutor(db, executor);
      const result = await runner.query(
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
        [id, payload.status, payload.motivoRejeicao || null, payload.servidorResponsavelId || null],
      );
      return mapEnrollment(result.rows[0]);
    },

    async delete(id, executor) {
      const runner = buildExecutor(db, executor);
      const result = await runner.query("DELETE FROM inscricoes WHERE id = $1", [id]);
      return result.rowCount > 0;
    },
  };
}

module.exports = { createEnrollmentRepository };

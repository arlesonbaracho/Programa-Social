function buildExecutor(db, executor) {
  return executor || db;
}

function mapNotification(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    usuarioId: row.usuario_id,
    tipo: row.tipo,
    canal: row.canal,
    titulo: row.titulo,
    mensagem: row.mensagem,
    programaId: row.programa_id,
    inscricaoId: row.inscricao_id,
    referenciaChave: row.referencia_chave,
    lido: row.lido,
    entregue: row.entregue,
    entregueEm: row.entregue_em,
    payload: row.payload,
    tentativasEntrega: row.tentativas_entrega,
    erroUltimaEntrega: row.erro_ultima_entrega,
    dataLeitura: row.data_leitura,
    dataCriacao: row.data_criacao,
  };
}

function createNotificationRepository({ db }) {
  return {
    async create(payload, executor) {
      const runner = buildExecutor(db, executor);
      const result = await runner.query(
        `
          INSERT INTO notificacoes (
            usuario_id, tipo, canal, titulo, mensagem, programa_id, inscricao_id,
            referencia_chave, entregue, entregue_em, payload, tentativas_entrega, erro_ultima_entrega
          )
          VALUES (
            $1, $2::tipo_notificacao, $3::canal_notificacao, $4, $5, $6, $7,
            $8, $9, $10, $11::jsonb, $12, $13
          )
          RETURNING *
        `,
        [
          payload.usuarioId,
          payload.tipo,
          payload.canal || "in_app",
          payload.titulo,
          payload.mensagem || null,
          payload.programaId || null,
          payload.inscricaoId || null,
          payload.referenciaChave || null,
          payload.entregue === true,
          payload.entregue === true ? new Date() : null,
          JSON.stringify(payload.payload || {}),
          payload.tentativasEntrega || 0,
          payload.erroUltimaEntrega || null,
        ],
      );
      return mapNotification(result.rows[0]);
    },

    async listByUserId(usuarioId, executor) {
      const runner = buildExecutor(db, executor);
      const result = await runner.query(
        `
          SELECT *
          FROM notificacoes
          WHERE usuario_id = $1 AND canal = 'in_app'
          ORDER BY data_criacao DESC
        `,
        [usuarioId],
      );
      return result.rows.map(mapNotification);
    },

    async findById(id, executor) {
      const runner = buildExecutor(db, executor);
      const result = await runner.query(
        "SELECT * FROM notificacoes WHERE id = $1 AND canal = 'in_app' LIMIT 1",
        [id],
      );
      return mapNotification(result.rows[0]);
    },

    async markAsRead(id, usuarioId, executor) {
      const runner = buildExecutor(db, executor);
      const result = await runner.query(
        `
          UPDATE notificacoes
          SET lido = TRUE, data_leitura = CURRENT_TIMESTAMP
          WHERE id = $1 AND usuario_id = $2 AND canal = 'in_app'
          RETURNING *
        `,
        [id, usuarioId],
      );
      return mapNotification(result.rows[0]);
    },

    async existsByReference({ usuarioId, canal, referenciaChave }, executor) {
      const runner = buildExecutor(db, executor);
      const result = await runner.query(
        `
          SELECT 1
          FROM notificacoes
          WHERE usuario_id = $1 AND canal = $2::canal_notificacao AND referencia_chave = $3
          LIMIT 1
        `,
        [usuarioId, canal, referenciaChave],
      );
      return result.rowCount > 0;
    },

    async listPendingExternal(limit = 100, executor) {
      const runner = buildExecutor(db, executor);
      const result = await runner.query(
        `
          SELECT *
          FROM notificacoes
          WHERE canal IN ('email', 'webhook') AND entregue = FALSE
          ORDER BY data_criacao ASC
          LIMIT $1
        `,
        [limit],
      );
      return result.rows.map(mapNotification);
    },

    async markAsDelivered(id, executor) {
      const runner = buildExecutor(db, executor);
      const result = await runner.query(
        `
          UPDATE notificacoes
          SET
            entregue = TRUE,
            entregue_em = CURRENT_TIMESTAMP,
            tentativas_entrega = tentativas_entrega + 1,
            erro_ultima_entrega = NULL
          WHERE id = $1
          RETURNING *
        `,
        [id],
      );
      return mapNotification(result.rows[0]);
    },

    async markAsFailed(id, errorMessage, executor) {
      const runner = buildExecutor(db, executor);
      const result = await runner.query(
        `
          UPDATE notificacoes
          SET
            tentativas_entrega = tentativas_entrega + 1,
            erro_ultima_entrega = $2
          WHERE id = $1
          RETURNING *
        `,
        [id, errorMessage],
      );
      return mapNotification(result.rows[0]);
    },
  };
}

module.exports = { createNotificationRepository };

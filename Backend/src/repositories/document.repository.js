function buildExecutor(db, executor) {
  return executor || db;
}

function mapDocument(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    usuarioId: row.usuario_id,
    inscricaoId: row.inscricao_id,
    tipo: row.tipo,
    arquivoUrl: row.arquivo_url,
    nomeArquivo: row.nome_arquivo,
    tamanhoBytes: row.tamanho_bytes,
    mimeType: row.mime_type,
    verificado: row.verificado,
    motivoRejeicao: row.motivo_rejeicao,
    servidorVerificadorId: row.servidor_verificador_id,
    dataUpload: row.data_upload,
    dataVerificacao: row.data_verificacao,
    dataExpiracao: row.data_expiracao,
  };
}

function createDocumentRepository({ db }) {
  return {
    async create(payload, executor) {
      const runner = buildExecutor(db, executor);
      const result = await runner.query(
        `
          INSERT INTO documentos (
            usuario_id, inscricao_id, tipo, arquivo_url, nome_arquivo,
            tamanho_bytes, mime_type, data_expiracao
          )
          VALUES ($1, $2, $3::tipo_documento, $4, $5, $6, $7, $8)
          RETURNING *
        `,
        [
          payload.usuarioId,
          payload.inscricaoId || null,
          payload.tipo,
          payload.arquivoUrl,
          payload.nomeArquivo,
          payload.tamanhoBytes || null,
          payload.mimeType || null,
          payload.dataExpiracao || null,
        ],
      );
      return mapDocument(result.rows[0]);
    },

    async findById(id, executor) {
      const runner = buildExecutor(db, executor);
      const result = await runner.query(
        "SELECT * FROM documentos WHERE id = $1 LIMIT 1",
        [id],
      );
      return mapDocument(result.rows[0]);
    },

    async delete(id, executor) {
      const runner = buildExecutor(db, executor);
      const result = await runner.query("DELETE FROM documentos WHERE id = $1", [id]);
      return result.rowCount > 0;
    },
  };
}

module.exports = { createDocumentRepository };

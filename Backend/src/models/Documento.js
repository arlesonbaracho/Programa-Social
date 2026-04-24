const BaseModel = require("./BaseModel");

class Documento extends BaseModel {
  constructor(db) {
    super(db, "documentos");
  }

  async create(data) {
    const result = await this.db.query(
      `
        INSERT INTO documentos (
          usuario_id,
          inscricao_id,
          tipo,
          arquivo_url,
          nome_arquivo,
          tamanho_bytes,
          mime_type
        )
        VALUES ($1, $2, $3::tipo_documento, $4, $5, $6, $7)
        RETURNING *
      `,
      [
        data.usuarioId,
        data.inscricaoId || null,
        data.tipo,
        data.arquivoUrl,
        data.nomeArquivo,
        data.tamanhoBytes || null,
        data.mimeType || null,
      ],
    );

    return result.rows[0];
  }

  async markAsVerified(id, servidorVerificadorId, motivoRejeicao = null) {
    const result = await this.db.query(
      `
        UPDATE documentos
        SET
          verificado = TRUE,
          motivo_rejeicao = $3,
          servidor_verificador_id = $2,
          data_verificacao = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING *
      `,
      [id, servidorVerificadorId, motivoRejeicao],
    );

    return result.rows[0] || null;
  }
}

module.exports = Documento;

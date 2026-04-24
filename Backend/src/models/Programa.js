const BaseModel = require("./BaseModel");

class Programa extends BaseModel {
  constructor(db) {
    super(db, "programas");
  }

  async create(data) {
    const result = await this.db.query(
      `
        INSERT INTO programas (
          gestor_id,
          nome,
          descricao,
          objetivo,
          publico_alvo,
          tipo,
          data_inicio_inscricao,
          data_fim_inscricao,
          data_inicio_programa,
          data_fim_programa,
          total_vagas,
          vagas_disponiveis,
          inscricao_automatica,
          status,
          local_realizacao,
          endereco_realizacao,
          responsavel_nome,
          responsavel_contato
        )
        VALUES (
          $1, $2, $3, $4, $5, $6::tipo_programa, $7, $8, $9, $10,
          $11, $12, $13, $14::status_programa, $15, $16, $17, $18
        )
        RETURNING *
      `,
      [
        data.gestorId,
        data.nome,
        data.descricao || null,
        data.objetivo || null,
        data.publicoAlvo || null,
        data.tipo,
        data.dataInicioInscricao,
        data.dataFimInscricao,
        data.dataInicioPrograma,
        data.dataFimPrograma,
        data.totalVagas,
        data.vagasDisponiveis,
        data.inscricaoAutomatica || false,
        data.status || "planejamento",
        data.localRealizacao || null,
        data.enderecoRealizacao || null,
        data.responsavelNome || null,
        data.responsavelContato || null,
      ],
    );

    return result.rows[0];
  }

  async findByGestorId(gestorId) {
    const result = await this.db.query(
      "SELECT * FROM programas WHERE gestor_id = $1 ORDER BY data_criacao DESC",
      [gestorId],
    );

    return result.rows;
  }

  async findOpenPrograms() {
    const result = await this.db.query(
      `
        SELECT *
        FROM programas
        WHERE status = 'inscricoes_abertas'::status_programa
          AND CURRENT_DATE BETWEEN data_inicio_inscricao AND data_fim_inscricao
        ORDER BY data_inicio_inscricao ASC
      `,
    );

    return result.rows;
  }
}

module.exports = Programa;

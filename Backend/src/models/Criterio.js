const BaseModel = require("./BaseModel");

class Criterio extends BaseModel {
  constructor(db) {
    super(db, "criterios");
  }

  async create(data) {
    const result = await this.db.query(
      `
        INSERT INTO criterios (
          programa_id,
          nome,
          descricao,
          tipo,
          valor_minimo,
          valor_maximo,
          obrigatorio,
          permite_multiplas_respostas,
          ordem
        )
        VALUES ($1, $2, $3, $4::tipo_criterio, $5, $6, $7, $8, $9)
        RETURNING *
      `,
      [
        data.programaId,
        data.nome,
        data.descricao || null,
        data.tipo,
        data.valorMinimo || null,
        data.valorMaximo || null,
        data.obrigatorio !== false,
        data.permiteMultiplasRespostas || false,
        data.ordem || 0,
      ],
    );

    return result.rows[0];
  }

  async findByProgramaId(programaId) {
    const result = await this.db.query(
      "SELECT * FROM criterios WHERE programa_id = $1 ORDER BY ordem ASC, data_criacao ASC",
      [programaId],
    );

    return result.rows;
  }
}

module.exports = Criterio;

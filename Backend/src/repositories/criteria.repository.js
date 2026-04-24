function buildExecutor(db, executor) {
  return executor || db;
}

function mapCriteria(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    programaId: row.programa_id,
    nome: row.nome,
    descricao: row.descricao,
    tipo: row.tipo,
    valorMinimo: row.valor_minimo,
    valorMaximo: row.valor_maximo,
    obrigatorio: row.obrigatorio,
    permiteMultiplasRespostas: row.permite_multiplas_respostas,
    ordem: row.ordem,
    dataCriacao: row.data_criacao,
  };
}

function createCriteriaRepository({ db }) {
  return {
    async findByProgramId(programaId, executor) {
      const runner = buildExecutor(db, executor);
      const result = await runner.query(
        `
          SELECT *
          FROM criterios
          WHERE programa_id = $1
          ORDER BY ordem ASC, data_criacao ASC
        `,
        [programaId],
      );
      return result.rows.map(mapCriteria);
    },

    async create(payload, executor) {
      const runner = buildExecutor(db, executor);
      const result = await runner.query(
        `
          INSERT INTO criterios (
            programa_id, nome, descricao, tipo, valor_minimo,
            valor_maximo, obrigatorio, permite_multiplas_respostas, ordem
          )
          VALUES ($1, $2, $3, $4::tipo_criterio, $5, $6, $7, $8, $9)
          RETURNING *
        `,
        [
          payload.programaId,
          payload.nome,
          payload.descricao || null,
          payload.tipo,
          payload.valorMinimo || null,
          payload.valorMaximo || null,
          payload.obrigatorio !== false,
          payload.permiteMultiplasRespostas || false,
          payload.ordem || 0,
        ],
      );
      return mapCriteria(result.rows[0]);
    },

    async createMany(programaId, criterios = [], executor) {
      const created = [];
      for (const criterio of criterios) {
        // eslint-disable-next-line no-await-in-loop
        const saved = await this.create({ ...criterio, programaId }, executor);
        created.push(saved);
      }
      return created;
    },

    async deleteByProgramId(programaId, executor) {
      const runner = buildExecutor(db, executor);
      await runner.query("DELETE FROM criterios WHERE programa_id = $1", [programaId]);
    },
  };
}

module.exports = { createCriteriaRepository };

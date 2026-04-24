function buildExecutor(db, executor) {
  return executor || db;
}

function mapProgram(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    gestorId: row.gestor_id,
    nome: row.nome,
    descricao: row.descricao,
    objetivo: row.objetivo,
    publicoAlvo: row.publico_alvo,
    tipo: row.tipo,
    dataInicioInscricao: row.data_inicio_inscricao,
    dataFimInscricao: row.data_fim_inscricao,
    dataInicioPrograma: row.data_inicio_programa,
    dataFimPrograma: row.data_fim_programa,
    totalVagas: row.total_vagas,
    vagasDisponiveis: row.vagas_disponiveis,
    inscricaoAutomatica: row.inscricao_automatica,
    status: row.status,
    localRealizacao: row.local_realizacao,
    enderecoRealizacao: row.endereco_realizacao,
    responsavelNome: row.responsavel_nome,
    responsavelContato: row.responsavel_contato,
    dataCriacao: row.data_criacao,
    dataAtualizacao: row.data_atualizacao,
  };
}

function createProgramRepository({ db }) {
  return {
    async findAll(filters = {}, executor) {
      const runner = buildExecutor(db, executor);
      const clauses = [];
      const params = [];

      if (filters.status) {
        params.push(filters.status);
        clauses.push(`status = $${params.length}::status_programa`);
      }

      if (filters.tipo) {
        params.push(filters.tipo);
        clauses.push(`tipo = $${params.length}::tipo_programa`);
      }

      if (filters.gestorId) {
        params.push(filters.gestorId);
        clauses.push(`gestor_id = $${params.length}`);
      }

      const whereClause = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
      const result = await runner.query(
        `SELECT * FROM programas ${whereClause} ORDER BY data_criacao DESC`,
        params,
      );
      return result.rows.map(mapProgram);
    },

    async findById(id, executor) {
      const runner = buildExecutor(db, executor);
      const result = await runner.query(
        "SELECT * FROM programas WHERE id = $1 LIMIT 1",
        [id],
      );
      return mapProgram(result.rows[0]);
    },

    async create(payload, executor) {
      const runner = buildExecutor(db, executor);
      const result = await runner.query(
        `
          INSERT INTO programas (
            gestor_id, nome, descricao, objetivo, publico_alvo, tipo,
            data_inicio_inscricao, data_fim_inscricao, data_inicio_programa, data_fim_programa,
            total_vagas, vagas_disponiveis, inscricao_automatica, status,
            local_realizacao, endereco_realizacao, responsavel_nome, responsavel_contato
          )
          VALUES (
            $1, $2, $3, $4, $5, $6::tipo_programa, $7, $8, $9, $10,
            $11, $12, $13, $14::status_programa, $15, $16, $17, $18
          )
          RETURNING *
        `,
        [
          payload.gestorId,
          payload.nome,
          payload.descricao || null,
          payload.objetivo || null,
          payload.publicoAlvo || null,
          payload.tipo,
          payload.dataInicioInscricao,
          payload.dataFimInscricao,
          payload.dataInicioPrograma,
          payload.dataFimPrograma,
          payload.totalVagas,
          payload.vagasDisponiveis,
          payload.inscricaoAutomatica,
          payload.status || "planejamento",
          payload.localRealizacao || null,
          payload.enderecoRealizacao || null,
          payload.responsavelNome || null,
          payload.responsavelContato || null,
        ],
      );
      return mapProgram(result.rows[0]);
    },

    async update(id, payload, executor) {
      const runner = buildExecutor(db, executor);
      const result = await runner.query(
        `
          UPDATE programas
          SET
            nome = $2,
            descricao = $3,
            objetivo = $4,
            publico_alvo = $5,
            tipo = $6::tipo_programa,
            data_inicio_inscricao = $7,
            data_fim_inscricao = $8,
            data_inicio_programa = $9,
            data_fim_programa = $10,
            total_vagas = $11,
            vagas_disponiveis = $12,
            inscricao_automatica = $13,
            local_realizacao = $14,
            endereco_realizacao = $15,
            responsavel_nome = $16,
            responsavel_contato = $17
          WHERE id = $1
          RETURNING *
        `,
        [
          id,
          payload.nome,
          payload.descricao || null,
          payload.objetivo || null,
          payload.publicoAlvo || null,
          payload.tipo,
          payload.dataInicioInscricao,
          payload.dataFimInscricao,
          payload.dataInicioPrograma,
          payload.dataFimPrograma,
          payload.totalVagas,
          payload.vagasDisponiveis,
          payload.inscricaoAutomatica,
          payload.localRealizacao || null,
          payload.enderecoRealizacao || null,
          payload.responsavelNome || null,
          payload.responsavelContato || null,
        ],
      );
      return mapProgram(result.rows[0]);
    },

    async delete(id, executor) {
      const runner = buildExecutor(db, executor);
      const result = await runner.query("DELETE FROM programas WHERE id = $1", [id]);
      return result.rowCount > 0;
    },

    async updateStatus(id, status, executor) {
      const runner = buildExecutor(db, executor);
      const result = await runner.query(
        `
          UPDATE programas
          SET status = $2::status_programa
          WHERE id = $1
          RETURNING *
        `,
        [id, status],
      );
      return mapProgram(result.rows[0]);
    },

    async decrementVacancies(id, executor) {
      const runner = buildExecutor(db, executor);
      const result = await runner.query(
        `
          UPDATE programas
          SET vagas_disponiveis = vagas_disponiveis - 1
          WHERE id = $1 AND vagas_disponiveis > 0
          RETURNING *
        `,
        [id],
      );
      return mapProgram(result.rows[0]);
    },

    async incrementVacancies(id, executor) {
      const runner = buildExecutor(db, executor);
      const result = await runner.query(
        `
          UPDATE programas
          SET vagas_disponiveis = vagas_disponiveis + 1
          WHERE id = $1 AND vagas_disponiveis < total_vagas
          RETURNING *
        `,
        [id],
      );
      return mapProgram(result.rows[0]);
    },
  };
}

module.exports = { createProgramRepository };

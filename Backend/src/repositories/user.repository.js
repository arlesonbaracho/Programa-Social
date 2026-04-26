function buildExecutor(db, executor) {
  return executor || db;
}

function mapUser(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    email: row.email,
    senhaHash: row.senha_hash,
    nome: row.nome,
    cpf: row.cpf,
    telefone: row.telefone,
    dataNascimento: row.data_nascimento,
    enderecoRua: row.endereco_rua,
    enderecoNumero: row.endereco_numero,
    enderecoComplemento: row.endereco_complemento,
    enderecoBairro: row.endereco_bairro,
    enderecoCidade: row.endereco_cidade,
    enderecoEstado: row.endereco_estado,
    enderecoCep: row.endereco_cep,
    tipo: row.tipo,
    status: row.status,
    dataCriacao: row.data_criacao,
    dataAtualizacao: row.data_atualizacao,
    dataUltimoAcesso: row.data_ultimo_acesso,
  };
}

function createUserRepository({ db }) {
  return {
    async create(payload, executor) {
      const runner = buildExecutor(db, executor);
      const result = await runner.query(
        `
          INSERT INTO usuarios (
            email, senha_hash, nome, cpf, telefone, data_nascimento,
            endereco_rua, endereco_numero, endereco_complemento,
            endereco_bairro, endereco_cidade, endereco_estado, endereco_cep,
            tipo, status
          )
          VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9,
            $10, $11, $12, $13, $14::tipo_usuario, $15::status_usuario
          )
          RETURNING *
        `,
        [
          payload.email,
          payload.senhaHash,
          payload.nome,
          payload.cpf || null,
          payload.telefone || null,
          payload.dataNascimento || null,
          payload.enderecoRua || null,
          payload.enderecoNumero || null,
          payload.enderecoComplemento || null,
          payload.enderecoBairro || null,
          payload.enderecoCidade || null,
          payload.enderecoEstado || null,
          payload.enderecoCep || null,
          payload.tipo,
          payload.status || "ativo",
        ],
      );
      return mapUser(result.rows[0]);
    },

    async findByEmail(email, executor) {
      const runner = buildExecutor(db, executor);
      const result = await runner.query(
        "SELECT * FROM usuarios WHERE email = $1 LIMIT 1",
        [email],
      );
      return mapUser(result.rows[0]);
    },

    async findById(id, executor) {
      const runner = buildExecutor(db, executor);
      const result = await runner.query(
        "SELECT * FROM usuarios WHERE id = $1 LIMIT 1",
        [id],
      );
      return mapUser(result.rows[0]);
    },

    async list(filters = {}, executor) {
      const runner = buildExecutor(db, executor);
      const clauses = [];
      const params = [];

      if (filters.tipo) {
        params.push(filters.tipo);
        clauses.push(`tipo = $${params.length}::tipo_usuario`);
      }

      if (filters.status) {
        params.push(filters.status);
        clauses.push(`status = $${params.length}::status_usuario`);
      }

      const whereClause = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
      const result = await runner.query(
        `SELECT * FROM usuarios ${whereClause} ORDER BY data_criacao DESC`,
        params,
      );

      return result.rows.map(mapUser);
    },

    async updateProfile(id, payload, executor) {
      const runner = buildExecutor(db, executor);
      const result = await runner.query(
        `
          UPDATE usuarios
          SET
            nome = COALESCE($2, nome),
            telefone = COALESCE($3, telefone),
            data_nascimento = COALESCE($4, data_nascimento),
            endereco_rua = COALESCE($5, endereco_rua),
            endereco_numero = COALESCE($6, endereco_numero),
            endereco_complemento = COALESCE($7, endereco_complemento),
            endereco_bairro = COALESCE($8, endereco_bairro),
            endereco_cidade = COALESCE($9, endereco_cidade),
            endereco_estado = COALESCE($10, endereco_estado),
            endereco_cep = COALESCE($11, endereco_cep)
          WHERE id = $1
          RETURNING *
        `,
        [
          id,
          payload.nome || null,
          payload.telefone || null,
          payload.dataNascimento || null,
          payload.enderecoRua || null,
          payload.enderecoNumero || null,
          payload.enderecoComplemento || null,
          payload.enderecoBairro || null,
          payload.enderecoCidade || null,
          payload.enderecoEstado || null,
          payload.enderecoCep || null,
        ],
      );
      return mapUser(result.rows[0]);
    },

    async updateStatus(id, status, executor) {
      const runner = buildExecutor(db, executor);
      const result = await runner.query(
        `
          UPDATE usuarios
          SET status = $2::status_usuario
          WHERE id = $1
          RETURNING *
        `,
        [id, status],
      );
      return mapUser(result.rows[0]);
    },

    async updateRole(id, tipo, executor) {
      const runner = buildExecutor(db, executor);
      const result = await runner.query(
        `
          UPDATE usuarios
          SET tipo = $2::tipo_usuario
          WHERE id = $1
          RETURNING *
        `,
        [id, tipo],
      );
      return mapUser(result.rows[0]);
    },

    async listByRole(tipo, executor) {
      return this.list({ tipo, status: "ativo" }, executor);
    },

    async touchLastAccess(id, executor) {
      const runner = buildExecutor(db, executor);
      await runner.query(
        "UPDATE usuarios SET data_ultimo_acesso = CURRENT_TIMESTAMP WHERE id = $1",
        [id],
      );
    },
  };
}

module.exports = { createUserRepository };

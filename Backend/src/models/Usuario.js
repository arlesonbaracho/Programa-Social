const BaseModel = require("./BaseModel");

class Usuario extends BaseModel {
  constructor(db) {
    super(db, "usuarios");
  }

  async create(data) {
    const result = await this.db.query(
      `
        INSERT INTO usuarios (
          email,
          senha_hash,
          nome,
          cpf,
          telefone,
          data_nascimento,
          endereco_rua,
          endereco_numero,
          endereco_complemento,
          endereco_bairro,
          endereco_cidade,
          endereco_estado,
          endereco_cep,
          tipo,
          status
        )
        VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9,
          $10, $11, $12, $13, $14::tipo_usuario, $15::status_usuario
        )
        RETURNING *
      `,
      [
        data.email,
        data.senhaHash,
        data.nome,
        data.cpf || null,
        data.telefone || null,
        data.dataNascimento || null,
        data.enderecoRua || null,
        data.enderecoNumero || null,
        data.enderecoComplemento || null,
        data.enderecoBairro || null,
        data.enderecoCidade || null,
        data.enderecoEstado || null,
        data.enderecoCep || null,
        data.tipo,
        data.status || "ativo",
      ],
    );

    return result.rows[0];
  }

  async findByEmail(email) {
    const result = await this.db.query(
      "SELECT * FROM usuarios WHERE email = $1 LIMIT 1",
      [email],
    );

    return result.rows[0] || null;
  }

  async updateLastAccess(id) {
    const result = await this.db.query(
      "UPDATE usuarios SET data_ultimo_acesso = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *",
      [id],
    );

    return result.rows[0] || null;
  }
}

module.exports = Usuario;

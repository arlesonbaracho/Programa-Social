const bcrypt = require("bcryptjs");

const { loadEnv } = require("../config/env");
const { createDatabase } = require("../config/database");

async function seed() {
  const env = loadEnv();
  const database = createDatabase({
    connectionString: env.databaseUrl,
    ...env.databaseConfig,
  });

  await database.connect();

  const senhaHash = await bcrypt.hash("123456", 10);

  const usuarios = [
    {
      nome: "Gestor Teste",
      email: "gestor@teste.com",
      tipo: "gestor",
      cpf: null,
    },
    {
      nome: "Servidor Teste",
      email: "servidor@teste.com",
      tipo: "servidor",
      cpf: null,
    },
    {
      nome: "Participante Teste",
      email: "participante@teste.com",
      tipo: "participante",
      cpf: "12345678900",
    },
  ];

  const insertedUsers = [];

  for (const usuario of usuarios) {
    const result = await database.query(
      `
        INSERT INTO usuarios (nome, email, senha_hash, tipo, status, cpf)
        VALUES ($1, $2, $3, $4::tipo_usuario, 'ativo'::status_usuario, $5)
        ON CONFLICT (email) DO UPDATE SET
          nome = EXCLUDED.nome,
          tipo = EXCLUDED.tipo,
          cpf = EXCLUDED.cpf
        RETURNING id, email, tipo
      `,
      [usuario.nome, usuario.email, senhaHash, usuario.tipo, usuario.cpf],
    );

    insertedUsers.push(result.rows[0]);
  }

  const gestor = insertedUsers.find((user) => user.tipo === "gestor");

  await database.query(
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
        local_realizacao
      )
      VALUES (
        $1,
        'Cesta Basica Municipal',
        'Distribuicao de cestas basicas para familias em vulnerabilidade.',
        'Garantir seguranca alimentar.',
        'Familias em situacao de vulnerabilidade social.',
        'assistencia'::tipo_programa,
        CURRENT_DATE,
        CURRENT_DATE + INTERVAL '15 days',
        CURRENT_DATE + INTERVAL '20 days',
        CURRENT_DATE + INTERVAL '60 days',
        300,
        300,
        FALSE,
        'inscricoes_abertas'::status_programa,
        'CRAS Centro'
      )
      ON CONFLICT DO NOTHING
    `,
    [gestor.id],
  );

  await database.query(
    `
      INSERT INTO criterios (
        programa_id,
        nome,
        descricao,
        tipo,
        valor_maximo,
        obrigatorio,
        ordem
      )
      SELECT
        p.id,
        'Renda Familiar Maxima',
        'A familia deve possuir renda de ate um salario minimo.',
        'renda'::tipo_criterio,
        '1518.00',
        TRUE,
        1
      FROM programas p
      WHERE p.nome = 'Cesta Basica Municipal'
      AND NOT EXISTS (
        SELECT 1
        FROM criterios c
        WHERE c.programa_id = p.id
        AND c.nome = 'Renda Familiar Maxima'
      )
    `,
  );

  await database.close();
  console.log("Seed data applied successfully.");
}

seed().catch((error) => {
  console.error("Seed failed:", error.message);
  process.exit(1);
});

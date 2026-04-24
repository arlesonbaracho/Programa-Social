const Usuario = require("../src/models/Usuario");
const Programa = require("../src/models/Programa");
const Inscricao = require("../src/models/Inscricao");
const Criterio = require("../src/models/Criterio");
const Documento = require("../src/models/Documento");
const Notificacao = require("../src/models/Notificacao");
const Sessao = require("../src/models/Sessao");

function createDb() {
  return {
    query: jest.fn(async () => ({
      rows: [{ id: "1" }],
      rowCount: 1,
    })),
  };
}

describe("Models", () => {
  test("Usuario.create persists into usuarios", async () => {
    const db = createDb();
    const model = new Usuario(db);

    await model.create({
      email: "gestor@teste.com",
      senhaHash: "hash",
      nome: "Gestor",
      tipo: "gestor",
    });

    expect(db.query.mock.calls[0][0]).toContain("INSERT INTO usuarios");
  });

  test("Programa.create persists into programas", async () => {
    const db = createDb();
    const model = new Programa(db);

    await model.create({
      gestorId: "1",
      nome: "Programa",
      tipo: "assistencia",
      dataInicioInscricao: "2026-04-18",
      dataFimInscricao: "2026-04-20",
      dataInicioPrograma: "2026-04-21",
      dataFimPrograma: "2026-05-20",
      totalVagas: 10,
      vagasDisponiveis: 10,
    });

    expect(db.query.mock.calls[0][0]).toContain("INSERT INTO programas");
  });

  test("Inscricao.create persists into inscricoes", async () => {
    const db = createDb();
    const model = new Inscricao(db);

    await model.create({
      usuarioId: "1",
      programaId: "2",
      respostasCriterios: { renda: true },
    });

    expect(db.query.mock.calls[0][0]).toContain("INSERT INTO inscricoes");
  });

  test("Criterio.create persists into criterios", async () => {
    const db = createDb();
    const model = new Criterio(db);

    await model.create({
      programaId: "2",
      nome: "Renda",
      tipo: "renda",
    });

    expect(db.query.mock.calls[0][0]).toContain("INSERT INTO criterios");
  });

  test("Documento.create persists into documentos", async () => {
    const db = createDb();
    const model = new Documento(db);

    await model.create({
      usuarioId: "1",
      tipo: "cpf",
      arquivoUrl: "/uploads/cpf.pdf",
      nomeArquivo: "cpf.pdf",
    });

    expect(db.query.mock.calls[0][0]).toContain("INSERT INTO documentos");
  });

  test("Notificacao.create persists into notificacoes", async () => {
    const db = createDb();
    const model = new Notificacao(db);

    await model.create({
      usuarioId: "1",
      tipo: "outro",
      titulo: "Aviso",
    });

    expect(db.query.mock.calls[0][0]).toContain("INSERT INTO notificacoes");
  });

  test("Sessao.create persists into sessoes", async () => {
    const db = createDb();
    const model = new Sessao(db);

    await model.create({
      usuarioId: "1",
      tokenRefresh: "refresh-token",
      dataExpiracao: "2026-04-25T00:00:00.000Z",
    });

    expect(db.query.mock.calls[0][0]).toContain("INSERT INTO sessoes");
  });
});

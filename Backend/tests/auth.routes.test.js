const jwt = require("jsonwebtoken");
const request = require("supertest");

const { createApp } = require("../src/app");

function buildDependencies(overrides = {}) {
  return {
    healthService: {
      getStatus: jest.fn(async () => ({
        name: "Programa Social",
        environment: "test",
        status: "ok",
        timestamp: new Date().toISOString(),
      })),
      getDatabaseStatus: jest.fn(async () => ({
        status: "ok",
        checkedAt: new Date().toISOString(),
      })),
    },
    citizenService: {
      createCitizen: jest.fn(),
    },
    authService: {
      register: jest.fn(async (payload) => ({
        user: { id: "1", email: payload.email, nome: payload.nome, tipo: "participante" },
        tokens: { accessToken: "token", refreshToken: "refresh", expiresIn: "1h" },
      })),
      login: jest.fn(async () => ({
        user: { id: "1", email: "user@example.com", nome: "User", tipo: "participante" },
        tokens: { accessToken: "token", refreshToken: "refresh", expiresIn: "1h" },
      })),
      refreshToken: jest.fn(),
      logout: jest.fn(async () => ({ success: true })),
    },
    programService: {
      listPrograms: jest.fn(async () => []),
      getProgramById: jest.fn(),
      createProgram: jest.fn(),
      updateProgram: jest.fn(),
      deleteProgram: jest.fn(),
      listProgramEnrollments: jest.fn(),
    },
    enrollmentService: {
      listMyEnrollments: jest.fn(),
      getEnrollmentById: jest.fn(),
      createEnrollment: jest.fn(),
      approveEnrollment: jest.fn(),
      rejectEnrollment: jest.fn(),
      cancelEnrollment: jest.fn(),
    },
    userService: {
      getProfile: jest.fn(),
      updateProfile: jest.fn(),
      listUsers: jest.fn(),
      updateStatus: jest.fn(),
    },
    notificationService: {
      listMyNotifications: jest.fn(),
      getNotificationById: jest.fn(),
      markAsRead: jest.fn(),
    },
    documentService: {
      uploadDocument: jest.fn(),
      getDocumentById: jest.fn(),
      deleteDocument: jest.fn(),
    },
    ...overrides,
  };
}

describe("Auth and RBAC routes", () => {
  beforeAll(() => {
    process.env.JWT_SECRET = "super-secret-test";
    process.env.JWT_REFRESH_SECRET = "refresh-secret-test";
  });

  test("POST /api/v1/auth/registrar creates a participant account", async () => {
    const dependencies = buildDependencies();
    const app = createApp(dependencies);

    const response = await request(app).post("/api/v1/auth/registrar").send({
      nome: "Maria da Silva",
      email: "maria@example.com",
      senha: "123456",
      cpf: "52998224725",
    });

    expect(response.statusCode).toBe(201);
    expect(response.body.user.email).toBe("maria@example.com");
    expect(dependencies.authService.register).toHaveBeenCalledTimes(1);
  });

  test("POST /api/v1/programas blocks participant user", async () => {
    const dependencies = buildDependencies();
    const app = createApp(dependencies);
    const token = jwt.sign(
      {
        sub: "user-1",
        email: "part@example.com",
        nome: "Participante",
        tipo: "participante",
      },
      process.env.JWT_SECRET,
    );

    const response = await request(app)
      .post("/api/v1/programas")
      .set("Authorization", `Bearer ${token}`)
      .send({
        nome: "Programa Teste",
        descricao: "Descricao",
        objetivo: "Objetivo",
        publicoAlvo: "Familias",
        tipo: "assistencia",
        dataInicioInscricao: "2026-04-20",
        dataFimInscricao: "2026-04-25",
        dataInicioPrograma: "2026-04-26",
        dataFimPrograma: "2026-05-20",
        totalVagas: 10,
        tipoInscricao: "manual",
        criterios: [],
      });

    expect(response.statusCode).toBe(403);
    expect(dependencies.programService.createProgram).not.toHaveBeenCalled();
  });
});

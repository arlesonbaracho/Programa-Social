const jwt = require("jsonwebtoken");
const request = require("supertest");

const { createApp } = require("../src/app");
const { BadRequestError } = require("../src/utils/errors");

function buildDependencies(overrides = {}) {
  return {
    healthService: {
      getStatus: jest.fn(),
      getDatabaseStatus: jest.fn(),
    },
    citizenService: {
      createCitizen: jest.fn(),
    },
    authService: {
      register: jest.fn(),
      login: jest.fn(),
      refreshToken: jest.fn(),
      logout: jest.fn(),
    },
    programService: {
      listPrograms: jest.fn(),
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
      updateRole: jest.fn(async (id, tipo) => ({
        id,
        nome: "Usuario Teste",
        email: "usuario@example.com",
        tipo,
        status: "ativo",
      })),
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

function signToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET);
}

describe("Users routes", () => {
  beforeAll(() => {
    process.env.JWT_SECRET = "super-secret-test";
    process.env.JWT_REFRESH_SECRET = "refresh-secret-test";
  });

  test("PUT /api/v1/usuarios/:id/tipo allows gestor to update a role", async () => {
    const dependencies = buildDependencies();
    const app = createApp(dependencies);
    const token = signToken({
      sub: "gestor-1",
      email: "gestor@example.com",
      nome: "Gestor",
      tipo: "gestor",
    });

    const response = await request(app)
      .put("/api/v1/usuarios/user-1/tipo")
      .set("Authorization", `Bearer ${token}`)
      .send({ tipo: "gestor" });

    expect(response.statusCode).toBe(200);
    expect(response.body.tipo).toBe("gestor");
    expect(dependencies.userService.updateRole).toHaveBeenCalledWith(
      "user-1",
      "gestor",
      expect.objectContaining({ id: "gestor-1", tipo: "gestor" }),
    );
  });

  test("PUT /api/v1/usuarios/:id/tipo blocks participant user", async () => {
    const dependencies = buildDependencies();
    const app = createApp(dependencies);
    const token = signToken({
      sub: "user-1",
      email: "part@example.com",
      nome: "Participante",
      tipo: "participante",
    });

    const response = await request(app)
      .put("/api/v1/usuarios/user-1/tipo")
      .set("Authorization", `Bearer ${token}`)
      .send({ tipo: "gestor" });

    expect(response.statusCode).toBe(403);
    expect(dependencies.userService.updateRole).not.toHaveBeenCalled();
  });

  test("PUT /api/v1/usuarios/:id/tipo blocks self demotion", async () => {
    const dependencies = buildDependencies({
      userService: {
        getProfile: jest.fn(),
        updateProfile: jest.fn(),
        listUsers: jest.fn(),
        updateStatus: jest.fn(),
        updateRole: jest.fn(async () => {
          throw new BadRequestError("Voce nao pode remover o proprio perfil de gestor.");
        }),
      },
    });
    const app = createApp(dependencies);
    const token = signToken({
      sub: "gestor-1",
      email: "gestor@example.com",
      nome: "Gestor",
      tipo: "gestor",
    });

    const response = await request(app)
      .put("/api/v1/usuarios/gestor-1/tipo")
      .set("Authorization", `Bearer ${token}`)
      .send({ tipo: "participante" });

    expect(response.statusCode).toBe(400);
    expect(response.body.message).toBe("Voce nao pode remover o proprio perfil de gestor.");
  });
});

const {
  createEnrollmentService,
  evaluateCriteria,
} = require("../src/services/enrollment.service");

function buildOpenProgram(overrides = {}) {
  const now = new Date();
  const start = new Date(now.getTime() - 86400000).toISOString().slice(0, 10);
  const end = new Date(now.getTime() + 86400000).toISOString().slice(0, 10);
  const endProgram = new Date(now.getTime() + 86400000 * 10)
    .toISOString()
    .slice(0, 10);

  return {
    id: "program-1",
    nome: "Cesta Basica",
    dataInicioInscricao: start,
    dataFimInscricao: end,
    dataInicioPrograma: end,
    dataFimPrograma: endProgram,
    vagasDisponiveis: 5,
    inscricaoAutomatica: true,
    ...overrides,
  };
}

describe("Enrollment service", () => {
  test("evaluateCriteria approves matching answers", () => {
    const result = evaluateCriteria(
      [
        {
          id: "crit-1",
          nome: "Renda Familiar",
          tipo: "renda",
          valorMaximo: "1000",
          obrigatorio: true,
        },
      ],
      { "crit-1": 800 },
    );

    expect(result.approved).toBe(true);
    expect(result.reasons).toHaveLength(0);
  });

  test("automatic enrollment approves and decrements vacancy", async () => {
    const client = {
      query: jest.fn(async () => ({ rows: [], rowCount: 0 })),
      release: jest.fn(),
    };

    const dependencies = {
      database: {
        getClient: jest.fn(async () => client),
      },
      programRepository: {
        findById: jest.fn(async () => buildOpenProgram()),
        decrementVacancies: jest.fn(async () => ({ id: "program-1" })),
      },
      criteriaRepository: {
        findByProgramId: jest.fn(async () => [
          {
            id: "crit-1",
            nome: "Renda Familiar",
            tipo: "renda",
            valorMaximo: "1000",
            obrigatorio: true,
          },
        ]),
      },
      enrollmentRepository: {
        findByUserAndProgram: jest.fn(async () => null),
        create: jest.fn(async (payload) => ({
          id: "enrollment-1",
          ...payload,
        })),
      },
      notificationService: {
        queueEnrollmentApproved: jest.fn(async () => []),
        queueEnrollmentRejected: jest.fn(async () => []),
        queueEnrollmentReceived: jest.fn(async () => []),
        flushPendingNotifications: jest.fn(async () => []),
      },
      userRepository: {
        listByRole: jest.fn(async () => []),
      },
    };

    const service = createEnrollmentService(dependencies);
    const result = await service.createEnrollment(
      {
        programaId: "program-1",
        respostasCriterios: { "crit-1": 800 },
      },
      { id: "user-1", tipo: "participante" },
    );

    expect(result.status).toBe("aprovada");
    expect(dependencies.programRepository.decrementVacancies).toHaveBeenCalledTimes(1);
    expect(dependencies.notificationService.queueEnrollmentApproved).toHaveBeenCalledWith(
      expect.objectContaining({
        participantId: "user-1",
      }),
      client,
    );
    expect(dependencies.notificationService.flushPendingNotifications).toHaveBeenCalledTimes(1);
  });

  test("manual enrollment stays pending and notifies servers", async () => {
    const client = {
      query: jest.fn(async () => ({ rows: [], rowCount: 0 })),
      release: jest.fn(),
    };

    const dependencies = {
      database: {
        getClient: jest.fn(async () => client),
      },
      programRepository: {
        findById: jest.fn(async () =>
          buildOpenProgram({
            inscricaoAutomatica: false,
          }),
        ),
        decrementVacancies: jest.fn(),
      },
      criteriaRepository: {
        findByProgramId: jest.fn(async () => []),
      },
      enrollmentRepository: {
        findByUserAndProgram: jest.fn(async () => null),
        create: jest.fn(async (payload) => ({
          id: "enrollment-2",
          ...payload,
        })),
      },
      notificationService: {
        queueEnrollmentApproved: jest.fn(async () => []),
        queueEnrollmentRejected: jest.fn(async () => []),
        queueEnrollmentReceived: jest.fn(async () => []),
        flushPendingNotifications: jest.fn(async () => []),
      },
      userRepository: {
        listByRole: jest.fn(async () => [{ id: "server-1", tipo: "servidor" }]),
      },
    };

    const service = createEnrollmentService(dependencies);
    const result = await service.createEnrollment(
      {
        programaId: "program-1",
        respostasCriterios: { renda: 600 },
      },
      { id: "user-2", tipo: "participante" },
    );

    expect(result.status).toBe("pendente");
    expect(dependencies.programRepository.decrementVacancies).not.toHaveBeenCalled();
    expect(dependencies.notificationService.queueEnrollmentReceived).toHaveBeenCalledTimes(1);
    expect(dependencies.notificationService.flushPendingNotifications).toHaveBeenCalledTimes(1);
  });
});

const { createProgramService } = require("../src/services/program.service");

describe("Program service", () => {
  test("createProgram stores planning program with criteria", async () => {
    const client = {
      query: jest.fn(async () => ({ rows: [], rowCount: 0 })),
      release: jest.fn(),
    };

    const programRepository = {
      create: jest.fn(async (payload) => ({
        id: "program-1",
        status: payload.status,
        ...payload,
      })),
      findById: jest.fn(),
      findAll: jest.fn(),
      updateStatus: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    const criteriaRepository = {
      createMany: jest.fn(async (programId, criterios) =>
        criterios.map((criterio, index) => ({
          id: `crit-${index + 1}`,
          programaId: programId,
          ...criterio,
        })),
      ),
      findByProgramId: jest.fn(async () => []),
      deleteByProgramId: jest.fn(),
    };

    const service = createProgramService({
      database: {
        getClient: jest.fn(async () => client),
      },
      programRepository,
      criteriaRepository,
      enrollmentRepository: {
        listByProgramId: jest.fn(),
      },
    });

    const result = await service.createProgram(
      {
        nome: "Peixe da Semana Santa",
        descricao: "Distribuicao de peixes",
        objetivo: "Atender familias vulneraveis",
        publicoAlvo: "Familias",
        tipo: "assistencia",
        dataInicioInscricao: "2026-04-20",
        dataFimInscricao: "2026-04-25",
        dataInicioPrograma: "2026-04-26",
        dataFimPrograma: "2026-04-30",
        totalVagas: 200,
        tipoInscricao: "manual",
        criterios: [
          {
            nome: "Renda",
            tipo: "renda",
            valorMaximo: "1000",
          },
        ],
      },
      { id: "gestor-1", tipo: "gestor" },
    );

    expect(result.status).toBe("planejamento");
    expect(programRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        gestorId: "gestor-1",
        vagasDisponiveis: 200,
        inscricaoAutomatica: false,
        status: "planejamento",
      }),
      client,
    );
    expect(criteriaRepository.createMany).toHaveBeenCalledTimes(1);
  });
});

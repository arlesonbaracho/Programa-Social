const {
  createNotificationService,
  buildReferenceKey,
} = require("../src/services/notification.service");

describe("Notification service", () => {
  test("queues in-app, email and webhook notifications with reference key", async () => {
    const notificationRepository = {
      existsByReference: jest.fn(async () => false),
      create: jest.fn(async (payload) => ({
        id: `${payload.canal}-1`,
        ...payload,
      })),
      listPendingExternal: jest.fn(async () => []),
      markAsDelivered: jest.fn(),
      markAsFailed: jest.fn(),
    };

    const service = createNotificationService({
      notificationRepository,
      userRepository: {
        findById: jest.fn(async () => ({ id: "user-1", email: "user@example.com" })),
        listByRole: jest.fn(async () => []),
      },
      programRepository: {
        findAll: jest.fn(async () => []),
      },
      enrollmentRepository: {
        listByProgramId: jest.fn(async () => []),
      },
      emailProvider: {
        send: jest.fn(async () => ({ sent: true })),
      },
      webhookProvider: {
        send: jest.fn(async () => ({ sent: true })),
      },
    });

    const queued = await service.queueEnrollmentApproved({
      participantId: "user-1",
      program: { id: "program-1", nome: "Programa Teste" },
      enrollmentId: "enrollment-1",
    });

    expect(queued).toHaveLength(3);
    expect(notificationRepository.create).toHaveBeenCalledTimes(3);
    expect(notificationRepository.create.mock.calls[0][0].referenciaChave).toContain(
      buildReferenceKey("inscricao_aprovada", ["enrollment-1"]),
    );
  });

  test("processes pending email/webhook deliveries", async () => {
    const notificationRepository = {
      existsByReference: jest.fn(),
      create: jest.fn(),
      listPendingExternal: jest.fn(async () => [
        {
          id: "email-1",
          canal: "email",
          usuarioId: "user-1",
          tipo: "inscricao_aprovada",
          titulo: "Aprovada",
          mensagem: "Sua inscricao foi aprovada.",
          payload: {},
        },
        {
          id: "hook-1",
          canal: "webhook",
          usuarioId: "user-1",
          tipo: "inscricao_aprovada",
          titulo: "Aprovada",
          mensagem: "Sua inscricao foi aprovada.",
          payload: {},
        },
      ]),
      markAsDelivered: jest.fn(async (id) => ({ id, entregue: true })),
      markAsFailed: jest.fn(),
    };

    const emailProvider = {
      send: jest.fn(async () => ({ sent: true })),
    };
    const webhookProvider = {
      send: jest.fn(async () => ({ sent: true })),
    };

    const service = createNotificationService({
      notificationRepository,
      userRepository: {
        findById: jest.fn(async () => ({ id: "user-1", email: "user@example.com" })),
        listByRole: jest.fn(async () => []),
      },
      programRepository: {
        findAll: jest.fn(async () => []),
      },
      enrollmentRepository: {
        listByProgramId: jest.fn(async () => []),
      },
      emailProvider,
      webhookProvider,
    });

    const result = await service.flushPendingNotifications();

    expect(result).toHaveLength(2);
    expect(emailProvider.send).toHaveBeenCalledTimes(1);
    expect(webhookProvider.send).toHaveBeenCalledTimes(1);
    expect(notificationRepository.markAsDelivered).toHaveBeenCalledTimes(2);
  });

  test("queues closing reminder for active participants not enrolled", async () => {
    const notificationRepository = {
      existsByReference: jest.fn(async () => false),
      create: jest.fn(async (payload) => ({ id: `${payload.canal}-1`, ...payload })),
      listPendingExternal: jest.fn(async () => []),
      markAsDelivered: jest.fn(),
      markAsFailed: jest.fn(),
    };

    const service = createNotificationService({
      notificationRepository,
      userRepository: {
        findById: jest.fn(async () => ({ id: "user-1", email: "user@example.com" })),
        listByRole: jest.fn(async () => [
          { id: "participant-1", status: "ativo" },
          { id: "participant-2", status: "ativo" },
        ]),
      },
      programRepository: {
        findAll: jest.fn(async () => [
          {
            id: "program-1",
            nome: "Programa Teste",
            dataInicioInscricao: "2026-04-20",
            dataFimInscricao: "2026-04-25",
            dataInicioPrograma: "2026-04-26",
            dataFimPrograma: "2026-04-30",
          },
        ]),
      },
      enrollmentRepository: {
        listByProgramId: jest.fn(async () => [{ usuarioId: "participant-2" }]),
      },
      emailProvider: {
        send: jest.fn(async () => ({ sent: true })),
      },
      webhookProvider: {
        send: jest.fn(async () => ({ sent: true })),
      },
    });

    const queued = await service.processClosingReminders(new Date("2026-04-23T12:00:00.000Z"));

    expect(queued.length).toBe(3);
    expect(notificationRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        usuarioId: "participant-1",
        tipo: "lembrete_inscricao",
      }),
      undefined,
    );
  });
});

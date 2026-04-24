const { ForbiddenError, NotFoundError } = require("../utils/errors");
const { resolveProgramStatus } = require("../utils/program-status");

function buildReferenceKey(type, suffixParts = []) {
  return [type, ...suffixParts].filter(Boolean).join(":");
}

function createNotificationService({
  notificationRepository,
  userRepository,
  programRepository,
  enrollmentRepository,
  emailProvider,
  webhookProvider,
}) {
  async function queueForChannels({
    usuarioId,
    tipo,
    titulo,
    mensagem,
    programaId,
    inscricaoId,
    payload,
    channels,
    referenceBase,
    executor,
  }) {
    const queued = [];

    for (const channel of channels) {
      const referenciaChave = referenceBase
        ? buildReferenceKey(referenceBase, [channel])
        : null;

      if (referenciaChave) {
        // eslint-disable-next-line no-await-in-loop
        const exists = await notificationRepository.existsByReference(
          { usuarioId, canal: channel, referenciaChave },
          executor,
        );
        if (exists) {
          continue;
        }
      }

      // eslint-disable-next-line no-await-in-loop
      const created = await notificationRepository.create(
        {
          usuarioId,
          tipo,
          canal: channel,
          titulo,
          mensagem,
          programaId,
          inscricaoId,
          referenciaChave,
          entregue: channel === "in_app",
          payload,
        },
        executor,
      );

      queued.push(created);
    }

    return queued;
  }

  async function deliverNotification(notification) {
    const user = await userRepository.findById(notification.usuarioId);
    if (!user) {
      throw new NotFoundError("Usuario da notificacao nao encontrado.");
    }

    if (notification.canal === "email") {
      if (!user.email) {
        throw new Error("Usuario sem email para entrega.");
      }

      await emailProvider.send({
        to: user.email,
        subject: notification.titulo,
        text: notification.mensagem || notification.titulo,
      });
      return;
    }

    if (notification.canal === "webhook") {
      await webhookProvider.send({
        event: notification.tipo,
        payload: {
          usuarioId: notification.usuarioId,
          programaId: notification.programaId,
          inscricaoId: notification.inscricaoId,
          titulo: notification.titulo,
          mensagem: notification.mensagem,
          payload: notification.payload,
        },
      });
    }
  }

  return {
    async listMyNotifications(currentUser) {
      return notificationRepository.listByUserId(currentUser.id);
    },

    async getNotificationById(id, currentUser) {
      const notification = await notificationRepository.findById(id);
      if (!notification) {
        throw new NotFoundError("Notificacao nao encontrada.");
      }

      if (notification.usuarioId !== currentUser.id) {
        throw new ForbiddenError("Voce nao pode acessar esta notificacao.");
      }

      return notification;
    },

    async markAsRead(id, currentUser) {
      const notification = await notificationRepository.markAsRead(id, currentUser.id);
      if (!notification) {
        throw new NotFoundError("Notificacao nao encontrada.");
      }
      return notification;
    },

    async queueEnrollmentReceived({ servidorIds, participantId, program, enrollmentId }, executor) {
      const queued = [];

      for (const servidorId of servidorIds) {
        // eslint-disable-next-line no-await-in-loop
        const notifications = await queueForChannels(
          {
            usuarioId: servidorId,
            tipo: "inscricao_recebida",
            titulo: "Nova inscricao pendente",
            mensagem: `Nova inscricao pendente para o programa ${program.nome}.`,
            programaId: program.id,
            inscricaoId: enrollmentId,
            payload: { participantId, event: "enrollment_received" },
            channels: ["in_app", "email", "webhook"],
            referenceBase: buildReferenceKey("inscricao_recebida", [
              enrollmentId,
              servidorId,
            ]),
            executor,
          },
          executor,
        );
        queued.push(...notifications);
      }

      return queued;
    },

    async queueEnrollmentApproved({ participantId, program, enrollmentId }, executor) {
      return queueForChannels(
        {
          usuarioId: participantId,
          tipo: "inscricao_aprovada",
          titulo: "Inscricao aprovada",
          mensagem: `Sua inscricao no programa ${program.nome} foi aprovada.`,
          programaId: program.id,
          inscricaoId: enrollmentId,
          payload: { event: "enrollment_approved" },
          channels: ["in_app", "email", "webhook"],
          referenceBase: buildReferenceKey("inscricao_aprovada", [enrollmentId]),
          executor,
        },
        executor,
      );
    },

    async queueEnrollmentRejected({ participantId, program, enrollmentId, reason }, executor) {
      return queueForChannels(
        {
          usuarioId: participantId,
          tipo: "inscricao_rejeitada",
          titulo: "Inscricao rejeitada",
          mensagem: reason,
          programaId: program.id,
          inscricaoId: enrollmentId,
          payload: { event: "enrollment_rejected", reason },
          channels: ["in_app", "email", "webhook"],
          referenceBase: buildReferenceKey("inscricao_rejeitada", [enrollmentId]),
          executor,
        },
        executor,
      );
    },

    async queueProgramStarting({ participantIds, program }, executor) {
      const queued = [];

      for (const participantId of participantIds) {
        // eslint-disable-next-line no-await-in-loop
        const notifications = await queueForChannels(
          {
            usuarioId: participantId,
            tipo: "programa_iniciando",
            titulo: "Programa iniciando",
            mensagem: `O programa ${program.nome} inicia em ${program.dataInicioPrograma}.`,
            programaId: program.id,
            payload: { event: "program_starting" },
            channels: ["in_app", "email", "webhook"],
            referenceBase: buildReferenceKey("programa_iniciando", [
              program.id,
              participantId,
            ]),
            executor,
          },
          executor,
        );
        queued.push(...notifications);
      }

      return queued;
    },

    async queueEnrollmentClosingReminder({ participantIds, program }, executor) {
      const queued = [];

      for (const participantId of participantIds) {
        // eslint-disable-next-line no-await-in-loop
        const notifications = await queueForChannels(
          {
            usuarioId: participantId,
            tipo: "lembrete_inscricao",
            titulo: "Inscricoes encerram em 48h",
            mensagem: `As inscricoes do programa ${program.nome} encerram em ${program.dataFimInscricao}.`,
            programaId: program.id,
            payload: { event: "closing_in_48h" },
            channels: ["in_app", "email", "webhook"],
            referenceBase: buildReferenceKey("lembrete_inscricao", [
              program.id,
              participantId,
            ]),
            executor,
          },
          executor,
        );
        queued.push(...notifications);
      }

      return queued;
    },

    async flushPendingNotifications(limit = 100) {
      const pending = await notificationRepository.listPendingExternal(limit);
      const processed = [];

      for (const notification of pending) {
        try {
          // eslint-disable-next-line no-await-in-loop
          await deliverNotification(notification);
          // eslint-disable-next-line no-await-in-loop
          const delivered = await notificationRepository.markAsDelivered(notification.id);
          processed.push(delivered);
        } catch (error) {
          // eslint-disable-next-line no-await-in-loop
          await notificationRepository.markAsFailed(notification.id, error.message);
        }
      }

      return processed;
    },

    async processProgramStartingNotifications(currentDate = new Date()) {
      const targetDate = new Date(currentDate).toISOString().slice(0, 10);
      const programs = await programRepository.findAll();
      const queued = [];

      for (const program of programs) {
        if (String(program.dataInicioPrograma) !== targetDate) {
          continue;
        }

        // eslint-disable-next-line no-await-in-loop
        const enrollments = await enrollmentRepository.listByProgramId(program.id);
        const participantIds = enrollments
          .filter((enrollment) => enrollment.status === "aprovada")
          .map((enrollment) => enrollment.usuarioId);

        // eslint-disable-next-line no-await-in-loop
        queued.push(...(await this.queueProgramStarting({ participantIds, program })));
      }

      await this.flushPendingNotifications();
      return queued;
    },

    async processClosingReminders(currentDate = new Date()) {
      const now = new Date(currentDate);
      const targetDate = new Date(now.getTime() + 48 * 60 * 60 * 1000)
        .toISOString()
        .slice(0, 10);
      const programs = await programRepository.findAll();
      const participants = await userRepository.listByRole("participante");
      const queued = [];

      for (const program of programs) {
        if (String(program.dataFimInscricao) !== targetDate) {
          continue;
        }

        if (resolveProgramStatus(program, currentDate) !== "inscricoes_abertas") {
          continue;
        }

        // eslint-disable-next-line no-await-in-loop
        const enrollments = await enrollmentRepository.listByProgramId(program.id);
        const enrolledUserIds = new Set(enrollments.map((enrollment) => enrollment.usuarioId));
        const participantIds = participants
          .filter((participant) => participant.status === "ativo")
          .filter((participant) => !enrolledUserIds.has(participant.id))
          .map((participant) => participant.id);

        // eslint-disable-next-line no-await-in-loop
        queued.push(
          ...(await this.queueEnrollmentClosingReminder({ participantIds, program })),
        );
      }

      await this.flushPendingNotifications();
      return queued;
    },
  };
}

module.exports = { createNotificationService, buildReferenceKey };

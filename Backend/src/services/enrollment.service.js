const { resolveProgramStatus } = require("../utils/program-status");
const {
  BadRequestError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
} = require("../utils/errors");

function readCriterionValue(answers, criterion) {
  if (!answers || typeof answers !== "object") {
    return undefined;
  }

  return answers[criterion.id] ?? answers[criterion.nome] ?? answers[criterion.tipo];
}

function evaluateCriteria(criteria = [], answers = {}) {
  const reasons = [];

  for (const criterion of criteria) {
    const value = readCriterionValue(answers, criterion);
    const required = criterion.obrigatorio !== false;

    if ((value === undefined || value === null || value === "") && required) {
      reasons.push(`Criterio obrigatorio nao atendido: ${criterion.nome}.`);
      continue;
    }

    if (value === undefined || value === null || value === "") {
      continue;
    }

    if (criterion.tipo === "renda" || criterion.tipo === "idade") {
      const numericValue = Number(value);
      const minValue =
        criterion.valorMinimo !== null && criterion.valorMinimo !== undefined
          ? Number(criterion.valorMinimo)
          : null;
      const maxValue =
        criterion.valorMaximo !== null && criterion.valorMaximo !== undefined
          ? Number(criterion.valorMaximo)
          : null;

      if (minValue !== null && numericValue < minValue) {
        reasons.push(`${criterion.nome} abaixo do minimo permitido.`);
      }

      if (maxValue !== null && numericValue > maxValue) {
        reasons.push(`${criterion.nome} acima do maximo permitido.`);
      }
      continue;
    }

    if (criterion.tipo === "documento" && !value) {
      reasons.push(`Documento obrigatorio ausente: ${criterion.nome}.`);
    }
  }

  return {
    approved: reasons.length === 0,
    reasons,
  };
}

function createEnrollmentService({
  database,
  programRepository,
  criteriaRepository,
  enrollmentRepository,
  notificationService,
  userRepository,
}) {
  return {
    async createEnrollment(payload, currentUser) {
      const program = await programRepository.findById(payload.programaId);
      if (!program) {
        throw new NotFoundError("Programa nao encontrado.");
      }

      const currentStatus = resolveProgramStatus(program);
      if (currentStatus !== "inscricoes_abertas") {
        throw new BadRequestError("O programa nao esta com inscricoes abertas.");
      }

      if (program.vagasDisponiveis <= 0) {
        throw new BadRequestError("Nao ha vagas disponiveis para este programa.");
      }

      const existingEnrollment = await enrollmentRepository.findByUserAndProgram(
        currentUser.id,
        payload.programaId,
      );

      if (existingEnrollment) {
        throw new ConflictError("Usuario ja inscrito neste programa.");
      }

      const criteria = await criteriaRepository.findByProgramId(payload.programaId);
      const client = await database.getClient();

      try {
        await client.query("BEGIN");

        if (program.inscricaoAutomatica) {
          const evaluation = evaluateCriteria(criteria, payload.respostasCriterios);
          const status = evaluation.approved ? "aprovada" : "rejeitada";
          const motivoRejeicao = evaluation.approved
            ? null
            : evaluation.reasons.join(" ");

          const enrollment = await enrollmentRepository.create(
            {
              usuarioId: currentUser.id,
              programaId: payload.programaId,
              status,
              respostasCriterios: payload.respostasCriterios,
              motivoRejeicao,
            },
            client,
          );

          if (evaluation.approved) {
            const updatedProgram = await programRepository.decrementVacancies(
              payload.programaId,
              client,
            );

            if (!updatedProgram) {
              throw new BadRequestError("Nao foi possivel reservar a vaga.");
            }

            await notificationService.queueEnrollmentApproved(
              {
                participantId: currentUser.id,
                program: {
                  ...program,
                  nome: program.nome,
                },
                enrollmentId: enrollment.id,
              },
              client,
            );
          } else {
            await notificationService.queueEnrollmentRejected(
              {
                participantId: currentUser.id,
                program,
                enrollmentId: enrollment.id,
                reason: motivoRejeicao,
              },
              client,
            );
          }

          await client.query("COMMIT");
          await notificationService.flushPendingNotifications();
          return enrollment;
        }

        const enrollment = await enrollmentRepository.create(
          {
            usuarioId: currentUser.id,
            programaId: payload.programaId,
            status: "pendente",
            respostasCriterios: payload.respostasCriterios,
          },
          client,
        );

        await notificationService.queueEnrollmentReceived(
          {
            participantId: currentUser.id,
            servidorIds: (await userRepository.listByRole("servidor", client)).map(
              (servidor) => servidor.id,
            ),
            program,
            enrollmentId: enrollment.id,
          },
          client,
        );

        await client.query("COMMIT");
        await notificationService.flushPendingNotifications();
        return enrollment;
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      } finally {
        client.release();
      }
    },

    async listMyEnrollments(currentUser) {
      return enrollmentRepository.listByUserId(currentUser.id);
    },

    async getEnrollmentById(id, currentUser) {
      const enrollment = await enrollmentRepository.findById(id);
      if (!enrollment) {
        throw new NotFoundError("Inscricao nao encontrada.");
      }

      if (currentUser.tipo === "participante" && enrollment.usuarioId !== currentUser.id) {
        throw new ForbiddenError("Voce nao pode acessar esta inscricao.");
      }

      return enrollment;
    },

    async approveEnrollment(id, currentUser) {
      const enrollment = await enrollmentRepository.findById(id);
      if (!enrollment) {
        throw new NotFoundError("Inscricao nao encontrada.");
      }

      if (enrollment.status !== "pendente") {
        throw new BadRequestError("Apenas inscricoes pendentes podem ser aprovadas.");
      }

      const program = await programRepository.findById(enrollment.programaId);
      if (!program) {
        throw new NotFoundError("Programa nao encontrado.");
      }

      const client = await database.getClient();
      try {
        await client.query("BEGIN");

        const updatedProgram = await programRepository.decrementVacancies(
          enrollment.programaId,
          client,
        );

        if (!updatedProgram) {
          throw new BadRequestError("Nao ha vagas disponiveis para aprovar esta inscricao.");
        }

        const updatedEnrollment = await enrollmentRepository.updateStatus(
          id,
          {
            status: "aprovada",
            servidorResponsavelId: currentUser.id,
          },
          client,
        );

        await notificationService.queueEnrollmentApproved(
          {
            participantId: enrollment.usuarioId,
            program,
            enrollmentId: updatedEnrollment.id,
          },
          client,
        );

        await client.query("COMMIT");
        await notificationService.flushPendingNotifications();
        return updatedEnrollment;
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      } finally {
        client.release();
      }
    },

    async rejectEnrollment(id, payload, currentUser) {
      const enrollment = await enrollmentRepository.findById(id);
      if (!enrollment) {
        throw new NotFoundError("Inscricao nao encontrada.");
      }

      if (enrollment.status !== "pendente") {
        throw new BadRequestError("Apenas inscricoes pendentes podem ser rejeitadas.");
      }

      const program = await programRepository.findById(enrollment.programaId);
      if (!program) {
        throw new NotFoundError("Programa nao encontrado.");
      }

      const client = await database.getClient();
      try {
        await client.query("BEGIN");
        const updatedEnrollment = await enrollmentRepository.updateStatus(
          id,
          {
            status: "rejeitada",
            motivoRejeicao: payload.motivoRejeicao,
            servidorResponsavelId: currentUser.id,
          },
          client,
        );

        await notificationService.queueEnrollmentRejected(
          {
            participantId: enrollment.usuarioId,
            program,
            enrollmentId: updatedEnrollment.id,
            reason: payload.motivoRejeicao,
          },
          client,
        );

        await client.query("COMMIT");
        await notificationService.flushPendingNotifications();
        return updatedEnrollment;
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      } finally {
        client.release();
      }
    },

    async cancelEnrollment(id, currentUser) {
      const enrollment = await enrollmentRepository.findById(id);
      if (!enrollment) {
        throw new NotFoundError("Inscricao nao encontrada.");
      }

      if (enrollment.usuarioId !== currentUser.id && currentUser.tipo !== "gestor") {
        throw new ForbiddenError("Voce nao pode cancelar esta inscricao.");
      }

      if (enrollment.status === "aprovada") {
        throw new BadRequestError(
          "Inscricoes aprovadas nao podem ser canceladas por este endpoint.",
        );
      }

      await enrollmentRepository.delete(id);
      return { success: true };
    },
  };
}

module.exports = { createEnrollmentService, evaluateCriteria };

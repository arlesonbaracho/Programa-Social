const { resolveProgramStatus } = require("../utils/program-status");
const { BadRequestError, NotFoundError } = require("../utils/errors");

function createProgramService({
  database,
  programRepository,
  criteriaRepository,
  enrollmentRepository,
}) {
  async function withCriteria(program) {
    if (!program) {
      return null;
    }

    const criterios = await criteriaRepository.findByProgramId(program.id);
    const resolvedStatus = resolveProgramStatus(program);

    if (resolvedStatus !== program.status) {
      const updatedProgram = await programRepository.updateStatus(program.id, resolvedStatus);
      return { ...updatedProgram, criterios };
    }

    return { ...program, criterios };
  }

  return {
    async listPrograms(filters = {}) {
      const programs = await programRepository.findAll(filters);
      const output = [];
      for (const program of programs) {
        // eslint-disable-next-line no-await-in-loop
        output.push(await withCriteria(program));
      }
      return output;
    },

    async getProgramById(id) {
      const program = await programRepository.findById(id);
      if (!program) {
        throw new NotFoundError("Programa nao encontrado.");
      }
      return withCriteria(program);
    },

    async createProgram(payload, currentUser) {
      if (new Date(payload.dataInicioInscricao) > new Date(payload.dataFimInscricao)) {
        throw new BadRequestError("A data inicial de inscricao deve ser menor que a final.");
      }

      if (new Date(payload.dataInicioPrograma) > new Date(payload.dataFimPrograma)) {
        throw new BadRequestError("A data inicial do programa deve ser menor que a final.");
      }

      const client = await database.getClient();
      try {
        await client.query("BEGIN");

        const program = await programRepository.create(
          {
            ...payload,
            gestorId: currentUser.id,
            vagasDisponiveis: payload.totalVagas,
            inscricaoAutomatica: payload.tipoInscricao === "automatica",
            status: "planejamento",
          },
          client,
        );

        const criterios = await criteriaRepository.createMany(
          program.id,
          payload.criterios || [],
          client,
        );

        await client.query("COMMIT");
        return { ...program, criterios };
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      } finally {
        client.release();
      }
    },

    async updateProgram(id, payload) {
      const existing = await programRepository.findById(id);
      if (!existing) {
        throw new NotFoundError("Programa nao encontrado.");
      }

      const occupiedSlots = existing.totalVagas - existing.vagasDisponiveis;
      const nextAvailableSlots = payload.totalVagas - occupiedSlots;
      if (nextAvailableSlots < 0) {
        throw new BadRequestError("O total de vagas nao pode ser menor que as vagas ja ocupadas.");
      }

      const client = await database.getClient();
      try {
        await client.query("BEGIN");

        const updatedProgram = await programRepository.update(
          id,
          {
            ...payload,
            vagasDisponiveis: nextAvailableSlots,
            inscricaoAutomatica: payload.tipoInscricao === "automatica",
          },
          client,
        );

        if (payload.criterios) {
          await criteriaRepository.deleteByProgramId(id, client);
          await criteriaRepository.createMany(id, payload.criterios, client);
        }

        await client.query("COMMIT");
        return withCriteria(updatedProgram);
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      } finally {
        client.release();
      }
    },

    async deleteProgram(id) {
      const deleted = await programRepository.delete(id);
      if (!deleted) {
        throw new NotFoundError("Programa nao encontrado.");
      }
      return { success: true };
    },

    async listProgramEnrollments(programId) {
      const program = await programRepository.findById(programId);
      if (!program) {
        throw new NotFoundError("Programa nao encontrado.");
      }
      return enrollmentRepository.listByProgramId(programId);
    },
  };
}

module.exports = { createProgramService };

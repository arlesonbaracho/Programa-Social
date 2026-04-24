function toDateOnly(dateValue) {
  return new Date(`${dateValue}T00:00:00.000Z`);
}

function resolveProgramStatus(program, currentDate = new Date()) {
  const now = new Date(currentDate);
  const startEnrollment = toDateOnly(
    program.dataInicioInscricao || program.data_inicio_inscricao,
  );
  const endEnrollment = toDateOnly(
    program.dataFimInscricao || program.data_fim_inscricao,
  );
  const startProgram = toDateOnly(
    program.dataInicioPrograma || program.data_inicio_programa,
  );
  const endProgram = toDateOnly(
    program.dataFimPrograma || program.data_fim_programa,
  );

  if (now < startEnrollment) {
    return "planejamento";
  }

  if (now >= startEnrollment && now <= endEnrollment) {
    return "inscricoes_abertas";
  }

  if (now > endEnrollment && now < startProgram) {
    return "inscricoes_fechadas";
  }

  if (now >= startProgram && now <= endProgram) {
    return "em_andamento";
  }

  return "finalizado";
}

module.exports = { resolveProgramStatus };

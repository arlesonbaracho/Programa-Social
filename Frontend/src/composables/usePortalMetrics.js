import dayjs from "dayjs";
import { computed } from "vue";

export function usePortalMetrics(programsRef = [], enrollmentsRef = []) {
  const metrics = computed(() => {
    const programs = programsRef.value || [];
    const enrollments = enrollmentsRef.value || [];

    return {
      totalPrograms: programs.length,
      openPrograms: programs.filter((program) => program.status === "inscricoes_abertas").length,
      pendingEnrollments: enrollments.filter((item) => item.status === "pendente").length,
      approvedEnrollments: enrollments.filter((item) => item.status === "aprovada").length,
      nextDeadline:
        programs
          .map((program) => program.dataFimInscricao)
          .filter(Boolean)
          .sort()[0] || null,
    };
  });

  const formattedDeadline = computed(() =>
    metrics.value.nextDeadline
      ? dayjs(metrics.value.nextDeadline).format("DD/MM/YYYY")
      : "Sem prazo imediato",
  );

  return {
    metrics,
    formattedDeadline,
  };
}

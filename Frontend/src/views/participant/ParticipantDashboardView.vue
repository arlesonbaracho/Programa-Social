<template>
  <section class="space-y-5">
    <AppHeader
      eyebrow="Portal do participante"
      title="Seus programas em um so lugar"
      subtitle="Veja primeiro o que encerra antes, acompanhe suas inscricoes e encontre rapidamente o que precisa fazer agora."
      :user-name="authStore.user?.nome || 'Participante'"
      :user-role="authStore.userRole || 'participante'"
    />

    <div class="grid gap-4 md:grid-cols-3">
      <MetricCard label="Programas abertos" :value="metrics.openPrograms" hint="Oportunidades com inscricoes disponiveis agora." />
      <MetricCard label="Inscricoes em analise" :value="metrics.pendingEnrollments" hint="Pedidos que ainda aguardam retorno da equipe." />
      <MetricCard label="Proximo encerramento" :value="formattedDeadline" hint="O prazo mais urgente entre os programas atuais." />
    </div>

    <div class="grid gap-5 xl:grid-cols-[1.25fr_0.75fr]">
      <div class="space-y-5">
        <div class="panel p-6">
          <div class="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p class="text-xs font-semibold uppercase tracking-[0.28em] text-forest/60">Programas em andamento</p>
              <h3 class="mt-2 font-display text-2xl text-ink">Encerrando mais cedo primeiro</h3>
              <p class="mt-2 text-sm leading-6 text-ink/65">
                Os cards abaixo mostram os programas atuais por ordem de prazo, para facilitar sua decisao.
              </p>
            </div>
          </div>

          <div
            v-if="currentPrograms.length"
            class="mt-6 grid gap-4 md:grid-cols-2"
          >
            <article
              v-for="program in currentPrograms"
              :key="program.id"
              class="rounded-[26px] border border-line/70 bg-gradient-to-br from-white to-sand/55 p-5"
            >
              <div class="flex items-start justify-between gap-4">
                <div>
                  <div class="flex flex-wrap items-center gap-2">
                    <span class="rounded-full bg-forest/10 px-3 py-1 text-xs font-semibold text-forest">
                      {{ statusLabel(program.status) }}
                    </span>
                    <span class="rounded-full bg-white px-3 py-1 text-xs text-ink/65">
                      {{ formatProgramType(program.tipo) }}
                    </span>
                  </div>
                  <h4 class="mt-4 text-lg font-semibold text-ink">{{ program.nome }}</h4>
                  <p class="mt-2 text-sm leading-6 text-ink/68">
                    {{ program.descricao || "Programa social com inscricao e acompanhamento digital." }}
                  </p>
                </div>
                <div class="rounded-2xl bg-white px-4 py-3 text-right">
                  <p class="text-xs uppercase tracking-[0.2em] text-ink/45">Prazo</p>
                  <p class="mt-1 font-semibold text-ink">{{ formatDeadline(program) }}</p>
                  <p class="mt-1 text-xs text-forest">{{ deadlineHint(program) }}</p>
                </div>
              </div>

              <div class="mt-5 grid gap-3 sm:grid-cols-3">
                <div class="rounded-2xl bg-white/85 px-4 py-3">
                  <p class="text-xs uppercase tracking-[0.2em] text-ink/45">Inscricao</p>
                  <p class="mt-1 text-sm font-semibold text-ink">{{ formatRange(program.dataInicioInscricao, program.dataFimInscricao) }}</p>
                </div>
                <div class="rounded-2xl bg-white/85 px-4 py-3">
                  <p class="text-xs uppercase tracking-[0.2em] text-ink/45">Programa</p>
                  <p class="mt-1 text-sm font-semibold text-ink">{{ formatRange(program.dataInicioPrograma, program.dataFimPrograma) }}</p>
                </div>
                <div class="rounded-2xl bg-white/85 px-4 py-3">
                  <p class="text-xs uppercase tracking-[0.2em] text-ink/45">Vagas</p>
                  <p class="mt-1 text-sm font-semibold text-ink">
                    {{ program.vagasDisponiveis ?? 0 }} de {{ program.totalVagas ?? 0 }}
                  </p>
                </div>
              </div>

              <div class="mt-5 flex flex-wrap items-center justify-between gap-3">
                <p class="text-sm text-ink/60">
                  {{ isEnrolled(program.id) ? "Voce ja possui cadastro neste programa." : "Envie sua inscricao online em poucos passos." }}
                </p>
                <button
                  class="action-button-primary"
                  :disabled="isEnrolled(program.id) || !isOpenForEnrollment(program)"
                  :class="isEnrolled(program.id) || !isOpenForEnrollment(program) ? 'cursor-not-allowed opacity-60' : ''"
                  @click="subscribe(program)"
                >
                  {{ isEnrolled(program.id) ? "Ja inscrito" : "Inscrever-se" }}
                </button>
              </div>
            </article>
          </div>

          <div
            v-else
            class="mt-6 rounded-[26px] border border-dashed border-line bg-sand/35 px-5 py-10 text-center text-sm text-ink/60"
          >
            Nenhum programa ativo no momento.
          </div>
        </div>

        <div class="panel p-6">
          <div class="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <p class="text-xs font-semibold uppercase tracking-[0.28em] text-forest/60">Programas ja cadastrados</p>
              <h3 class="mt-2 font-display text-2xl text-ink">Seu historico de participacao</h3>
            </div>
            <p class="text-sm text-ink/60">
              {{ enrolledPrograms.length }} programa(s) com inscricao registrada
            </p>
          </div>

          <div v-if="enrolledPrograms.length" class="mt-5 grid gap-4 md:grid-cols-2">
            <article
              v-for="enrollment in enrolledPrograms"
              :key="enrollment.id"
              class="rounded-[24px] border border-line/70 bg-white p-5"
            >
              <div class="flex items-start justify-between gap-3">
                <div>
                  <p class="text-lg font-semibold text-ink">{{ enrollment.programName }}</p>
                  <p class="mt-1 text-sm text-ink/60">
                    {{ enrollment.programType }}
                  </p>
                </div>
                <span
                  class="rounded-full px-3 py-1 text-xs font-semibold"
                  :class="statusClass(enrollment.status)"
                >
                  {{ statusLabel(enrollment.status) }}
                </span>
              </div>

              <div class="mt-4 grid gap-3 sm:grid-cols-2">
                <div class="rounded-2xl bg-sand/45 px-4 py-3">
                  <p class="text-xs uppercase tracking-[0.2em] text-ink/45">Inscricao enviada</p>
                  <p class="mt-1 text-sm font-semibold text-ink">{{ formatDate(enrollment.dataInscricao) }}</p>
                </div>
                <div class="rounded-2xl bg-sand/45 px-4 py-3">
                  <p class="text-xs uppercase tracking-[0.2em] text-ink/45">Prazo final</p>
                  <p class="mt-1 text-sm font-semibold text-ink">{{ enrollment.programDeadline }}</p>
                </div>
              </div>

              <p v-if="enrollment.motivoRejeicao" class="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">
                Motivo: {{ enrollment.motivoRejeicao }}
              </p>
            </article>
          </div>

          <div
            v-else
            class="mt-5 rounded-[24px] border border-dashed border-line bg-sand/35 px-5 py-10 text-center text-sm text-ink/60"
          >
            Voce ainda nao possui inscricoes registradas.
          </div>
        </div>
      </div>

      <div class="space-y-5">
        <div class="panel p-6">
          <div class="flex items-center justify-between gap-3">
            <div>
              <p class="text-xs font-semibold uppercase tracking-[0.28em] text-forest/60">Resumo rapido</p>
              <h3 class="mt-2 font-display text-2xl text-ink">Seu andamento</h3>
            </div>
            <span class="rounded-full bg-sand px-3 py-1 text-xs font-semibold text-forest">
              {{ metrics.approvedEnrollments }} aprovadas
            </span>
          </div>

          <div class="mt-5 space-y-3">
            <div class="rounded-2xl bg-sand/45 px-4 py-4">
              <p class="text-sm text-ink/60">Programas que encerram em breve</p>
              <p class="mt-1 text-2xl font-semibold text-ink">{{ currentPrograms.length }}</p>
            </div>
            <div class="rounded-2xl bg-sand/45 px-4 py-4">
              <p class="text-sm text-ink/60">Inscricoes pendentes</p>
              <p class="mt-1 text-2xl font-semibold text-ink">{{ metrics.pendingEnrollments }}</p>
            </div>
            <div class="rounded-2xl bg-sand/45 px-4 py-4">
              <p class="text-sm text-ink/60">Ultimo prazo relevante</p>
              <p class="mt-1 text-lg font-semibold text-ink">{{ formattedDeadline }}</p>
            </div>
          </div>
        </div>

        <div class="panel p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-xs font-semibold uppercase tracking-[0.28em] text-forest/60">Notificacoes</p>
              <h3 class="mt-2 font-display text-2xl text-ink">Atualizacoes recentes</h3>
            </div>
            <button class="action-button-secondary" @click="notificationsStore.fetchNotifications()">
              Atualizar
            </button>
          </div>

          <div v-if="notificationsStore.items.length" class="mt-5 space-y-3">
            <article
              v-for="notification in notificationsStore.items.slice(0, 5)"
              :key="notification.id"
              class="rounded-[24px] border border-line/70 bg-white p-4"
            >
              <div class="flex items-start justify-between gap-4">
                <div>
                  <p class="font-semibold text-ink">{{ notification.titulo }}</p>
                  <p class="mt-2 text-sm leading-6 text-ink/68">{{ notification.mensagem }}</p>
                </div>
                <button
                  v-if="!notification.lido"
                  class="action-button-secondary shrink-0"
                  @click="notificationsStore.markAsRead(notification.id)"
                >
                  Marcar lida
                </button>
              </div>
            </article>
          </div>

          <div
            v-else
            class="mt-5 rounded-[24px] border border-dashed border-line bg-sand/35 px-5 py-10 text-center text-sm text-ink/60"
          >
            Nenhuma notificacao recente.
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed, onMounted } from "vue";
import dayjs from "dayjs";

import AppHeader from "@/components/shell/AppHeader.vue";
import MetricCard from "@/components/ui/MetricCard.vue";
import { usePortalMetrics } from "@/composables/usePortalMetrics";
import { useAuthStore } from "@/stores/auth";
import { useProgramsStore } from "@/stores/programs";
import { useEnrollmentsStore } from "@/stores/enrollments";
import { useNotificationsStore } from "@/stores/notifications";

const authStore = useAuthStore();
const programsStore = useProgramsStore();
const enrollmentsStore = useEnrollmentsStore();
const notificationsStore = useNotificationsStore();

const { metrics, formattedDeadline } = usePortalMetrics(
  computed(() => programsStore.programs),
  computed(() => enrollmentsStore.items),
);

const enrolledProgramIds = computed(() =>
  new Set(enrollmentsStore.items.map((item) => item.programaId)),
);

const programsById = computed(() =>
  Object.fromEntries(programsStore.programs.map((program) => [program.id, program])),
);

const currentPrograms = computed(() =>
  [...programsStore.programs]
    .filter((program) => ["inscricoes_abertas", "em_andamento"].includes(program.status))
    .sort((left, right) => getRelevantDate(left) - getRelevantDate(right)),
);

const enrolledPrograms = computed(() =>
  enrollmentsStore.items
    .map((enrollment) => {
      const program = programsById.value[enrollment.programaId];

      return {
        ...enrollment,
        programName: program?.nome || `Programa ${enrollment.programaId.slice(0, 8)}`,
        programType: formatProgramType(program?.tipo),
        programDeadline: program ? formatDeadline(program) : "Prazo nao informado",
      };
    })
    .sort((left, right) => new Date(right.dataInscricao) - new Date(left.dataInscricao)),
);

function statusClass(status) {
  if (status === "aprovada") {
    return "bg-emerald-100 text-emerald-700";
  }

  if (status === "rejeitada") {
    return "bg-red-100 text-red-700";
  }

  if (status === "em_andamento") {
    return "bg-blue-100 text-blue-700";
  }

  return "bg-amber-100 text-amber-700";
}

function isOpenForEnrollment(program) {
  return program.status === "inscricoes_abertas" && Number(program.vagasDisponiveis || 0) > 0;
}

function isEnrolled(programId) {
  return enrolledProgramIds.value.has(programId);
}

function getRelevantDate(program) {
  const reference = program.status === "em_andamento"
    ? program.dataFimPrograma || program.dataFimInscricao
    : program.dataFimInscricao || program.dataFimPrograma;
  return new Date(reference || "9999-12-31");
}

function formatDate(value) {
  if (!value) {
    return "Nao informado";
  }

  return dayjs(value).format("DD/MM/YYYY");
}

function formatRange(start, end) {
  if (!start && !end) {
    return "Nao informado";
  }

  return `${formatDate(start)} ate ${formatDate(end)}`;
}

function formatDeadline(program) {
  return formatDate(program.status === "em_andamento" ? program.dataFimPrograma : program.dataFimInscricao);
}

function deadlineHint(program) {
  const endDate = dayjs(program.status === "em_andamento" ? program.dataFimPrograma : program.dataFimInscricao);

  if (!endDate.isValid()) {
    return "Sem prazo definido";
  }

  const diff = endDate.startOf("day").diff(dayjs().startOf("day"), "day");

  if (diff < 0) {
    return "Prazo encerrado";
  }

  if (diff === 0) {
    return "Encerra hoje";
  }

  if (diff === 1) {
    return "Encerra amanha";
  }

  return `Faltam ${diff} dias`;
}

function formatProgramType(type) {
  if (!type) {
    return "Programa social";
  }

  return String(type).charAt(0).toUpperCase() + String(type).slice(1);
}

function statusLabel(status) {
  const labels = {
    inscricoes_abertas: "Inscricoes abertas",
    inscricoes_fechadas: "Inscricoes fechadas",
    em_andamento: "Em andamento",
    finalizado: "Finalizado",
    planejamento: "Planejamento",
    aprovada: "Aprovada",
    rejeitada: "Rejeitada",
    pendente: "Pendente",
  };

  return labels[status] || status;
}

async function subscribe(program) {
  if (isEnrolled(program.id) || !isOpenForEnrollment(program)) {
    return;
  }

  await enrollmentsStore.createEnrollment({
    programaId: program.id,
    respostasCriterios: {},
  });
  await enrollmentsStore.fetchMyEnrollments();
  await notificationsStore.fetchNotifications();
}

onMounted(async () => {
  await Promise.all([
    programsStore.fetchPrograms(),
    enrollmentsStore.fetchMyEnrollments(),
    notificationsStore.fetchNotifications(),
  ]);
});
</script>

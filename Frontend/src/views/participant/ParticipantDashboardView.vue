<template>
  <section class="space-y-4">
    <AppHeader
      eyebrow="Portal do participante"
      title="Programas disponiveis"
      subtitle="Acompanhe prazos, envie inscricoes e verifique o retorno da assistencia social."
      :user-name="authStore.user?.nome || 'Participante'"
      :user-role="authStore.userRole || 'participante'"
    />

    <div class="grid gap-4 md:grid-cols-3">
      <MetricCard label="Programas abertos" :value="metrics.openPrograms" hint="Oportunidades atualmente disponiveis." />
      <MetricCard label="Minhas pendencias" :value="metrics.pendingEnrollments" hint="Inscricoes aguardando analise." />
      <MetricCard label="Proximo encerramento" :value="formattedDeadline" hint="Prazo mais proximo para inscricao." />
    </div>

    <div class="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
      <div class="space-y-4">
        <DataTable
          :columns="programColumns"
          :items="programsStore.openPrograms"
          empty-message="Nenhum programa com inscricoes abertas."
        >
          <template #status="{ item }">
            <span class="rounded-full bg-forest/10 px-3 py-1 text-xs font-semibold text-forest">
              {{ item.status }}
            </span>
          </template>
          <template #acao="{ item }">
            <button class="action-button-primary" @click="subscribe(item)">
              Inscrever-se
            </button>
          </template>
        </DataTable>
      </div>

      <div class="space-y-4">
        <DataTable
          :columns="enrollmentColumns"
          :items="enrollmentsStore.items"
          empty-message="Nenhuma inscricao registrada."
        >
          <template #status="{ item }">
            <span
              class="rounded-full px-3 py-1 text-xs font-semibold"
              :class="statusClass(item.status)"
            >
              {{ item.status }}
            </span>
          </template>
        </DataTable>

        <div class="panel p-5">
          <div class="flex items-center justify-between">
            <div>
              <p class="font-semibold text-ink">Notificacoes</p>
              <p class="text-sm text-ink/65">Mensagens recentes do sistema.</p>
            </div>
            <button class="action-button-secondary" @click="notificationsStore.fetchNotifications()">
              Atualizar
            </button>
          </div>

          <div class="mt-4 space-y-3">
            <article
              v-for="notification in notificationsStore.items.slice(0, 5)"
              :key="notification.id"
              class="rounded-2xl border border-line/60 bg-white/75 p-4"
            >
              <div class="flex items-start justify-between gap-4">
                <div>
                  <p class="font-semibold text-ink">{{ notification.titulo }}</p>
                  <p class="mt-1 text-sm text-ink/68">{{ notification.mensagem }}</p>
                </div>
                <button
                  v-if="!notification.lido"
                  class="action-button-secondary"
                  @click="notificationsStore.markAsRead(notification.id)"
                >
                  Marcar lida
                </button>
              </div>
            </article>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed, onMounted } from "vue";

import AppHeader from "@/components/shell/AppHeader.vue";
import MetricCard from "@/components/ui/MetricCard.vue";
import DataTable from "@/components/ui/DataTable.vue";
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

const programColumns = [
  { key: "nome", label: "Programa" },
  { key: "tipo", label: "Tipo" },
  { key: "dataFimInscricao", label: "Prazo" },
  { key: "status", label: "Status" },
  { key: "acao", label: "Acao" },
];

const enrollmentColumns = [
  { key: "programaId", label: "Programa" },
  { key: "status", label: "Status" },
  { key: "dataInscricao", label: "Inscricao" },
];

function statusClass(status) {
  if (status === "aprovada") {
    return "bg-emerald-100 text-emerald-700";
  }

  if (status === "rejeitada") {
    return "bg-red-100 text-red-700";
  }

  return "bg-amber-100 text-amber-700";
}

async function subscribe(program) {
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

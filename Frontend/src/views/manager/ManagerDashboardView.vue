<template>
  <section class="space-y-4">
    <AppHeader
      eyebrow="Portal do gestor"
      title="Visao executiva dos programas"
      subtitle="Monitore adesao, gargalos operacionais e desempenho dos programas em tempo real."
      :user-name="authStore.user?.nome || 'Gestor'"
      :user-role="authStore.userRole || 'gestor'"
    />

    <div class="grid gap-4 md:grid-cols-4">
      <MetricCard label="Programas totais" :value="metrics.totalPrograms" hint="Base consolidada de programas ativos e planejados." />
      <MetricCard label="Inscricoes abertas" :value="metrics.openPrograms" hint="Programas em fase de captação." />
      <MetricCard label="Inscricoes pendentes" :value="metrics.pendingEnrollments" hint="Volume aguardando tratativa." />
      <MetricCard label="Aprovadas" :value="metrics.approvedEnrollments" hint="Demandas validadas com sucesso." />
    </div>

    <div class="flex justify-end">
      <RouterLink class="action-button-primary" :to="{ name: 'create-program' }">
        Criar novo programa
      </RouterLink>
    </div>

    <DataTable
      :columns="columns"
      :items="programsStore.programs"
      empty-message="Nenhum programa cadastrado."
    >
      <template #status="{ item }">
        <span class="rounded-full bg-clay/10 px-3 py-1 text-xs font-semibold text-clay">
          {{ item.status }}
        </span>
      </template>
      <template #vagasDisponiveis="{ item }">
        {{ item.vagasDisponiveis }} / {{ item.totalVagas }}
      </template>
    </DataTable>
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
import api from "@/services/api";

const authStore = useAuthStore();
const programsStore = useProgramsStore();

const syntheticEnrollments = computed(() =>
  programsStore.programs.flatMap((program) => program.inscricoes || []),
);
const { metrics } = usePortalMetrics(
  computed(() => programsStore.programs),
  syntheticEnrollments,
);

const columns = [
  { key: "nome", label: "Programa" },
  { key: "tipo", label: "Tipo" },
  { key: "status", label: "Status" },
  { key: "vagasDisponiveis", label: "Vagas" },
  { key: "dataFimInscricao", label: "Fim das inscricoes" },
];

async function loadPrograms() {
  await programsStore.fetchPrograms();
  const detailedPrograms = [];
  for (const program of programsStore.programs) {
    // eslint-disable-next-line no-await-in-loop
    const response = await api.get(`/programas/${program.id}/inscricoes`);
    detailedPrograms.push({
      ...program,
      inscricoes: response.data,
    });
  }
  programsStore.programs = detailedPrograms;
}

onMounted(loadPrograms);
</script>

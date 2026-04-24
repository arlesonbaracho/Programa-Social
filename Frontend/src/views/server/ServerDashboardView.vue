<template>
  <section class="space-y-4">
    <AppHeader
      eyebrow="Portal do servidor"
      title="Fila de analise"
      subtitle="Acompanhe inscricoes pendentes, valide rapidamente e mantenha a operacao sob controle."
      :user-name="authStore.user?.nome || 'Servidor'"
      :user-role="authStore.userRole || 'servidor'"
    />

    <div class="grid gap-4 md:grid-cols-3">
      <MetricCard label="Inscricoes pendentes" :value="pendingCount" hint="Demandas aguardando decisao." />
      <MetricCard label="Aprovadas" :value="approvedCount" hint="Cadastros validados recentemente." />
      <MetricCard label="Programas monitorados" :value="programsStore.programs.length" hint="Programas com visao operacional." />
    </div>

    <DataTable
      :columns="columns"
      :items="pendingEnrollments"
      empty-message="Nenhuma inscricao pendente de aprovacao."
    >
      <template #acoes="{ item }">
        <div class="flex gap-2">
          <button class="action-button-primary" @click="approve(item.id)">Aprovar</button>
          <button class="action-button-secondary" @click="reject(item.id)">Rejeitar</button>
        </div>
      </template>
    </DataTable>
  </section>
</template>

<script setup>
import { computed, onMounted } from "vue";

import AppHeader from "@/components/shell/AppHeader.vue";
import MetricCard from "@/components/ui/MetricCard.vue";
import DataTable from "@/components/ui/DataTable.vue";
import api from "@/services/api";
import { useAuthStore } from "@/stores/auth";
import { useProgramsStore } from "@/stores/programs";

const authStore = useAuthStore();
const programsStore = useProgramsStore();
const enrollments = computed(() =>
  programsStore.programs.flatMap((program) => program.inscricoes || []),
);
const pendingEnrollments = computed(() =>
  enrollments.value.filter((item) => item.status === "pendente"),
);
const pendingCount = computed(() => pendingEnrollments.value.length);
const approvedCount = computed(
  () => enrollments.value.filter((item) => item.status === "aprovada").length,
);

const columns = [
  { key: "programaId", label: "Programa" },
  { key: "usuarioId", label: "Participante" },
  { key: "dataInscricao", label: "Data" },
  { key: "acoes", label: "Acoes" },
];

async function fetchManagedPrograms() {
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

async function approve(id) {
  await api.put(`/inscricoes/${id}/aprovar`);
  await fetchManagedPrograms();
}

async function reject(id) {
  await api.put(`/inscricoes/${id}/rejeitar`, {
    motivoRejeicao: "Pendencia documental ou criterio nao atendido.",
  });
  await fetchManagedPrograms();
}

onMounted(fetchManagedPrograms);
</script>

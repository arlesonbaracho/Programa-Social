<template>
  <section class="space-y-5">
    <AppHeader
      eyebrow="Portal do gestor"
      title="Controle de programas e acessos"
      subtitle="Gerencie programas, acompanhe indicadores e organize os perfis de quem opera a plataforma."
      :user-name="authStore.user?.nome || 'Gestor'"
      :user-role="authStore.userRole || 'gestor'"
    />

    <div class="grid gap-4 md:grid-cols-4">
      <MetricCard label="Programas totais" :value="metrics.totalPrograms" hint="Base consolidada de programas ativos e planejados." />
      <MetricCard label="Inscricoes abertas" :value="metrics.openPrograms" hint="Programas em fase de captacao." />
      <MetricCard label="Inscricoes pendentes" :value="metrics.pendingEnrollments" hint="Volume aguardando tratativa." />
      <MetricCard label="Usuarios ativos" :value="usersStore.activeUsers.length" hint="Contas com acesso liberado ao sistema." />
    </div>

    <div class="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
      <div class="space-y-5">
        <div class="flex justify-end">
          <RouterLink class="action-button-primary" :to="{ name: 'create-program' }">
            Criar novo programa
          </RouterLink>
        </div>

        <div class="panel p-6">
          <div class="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <p class="text-xs font-semibold uppercase tracking-[0.28em] text-forest/60">Programas</p>
              <h3 class="mt-2 font-display text-2xl text-ink">Acompanhamento geral</h3>
              <p class="mt-2 text-sm leading-6 text-ink/65">
                Consulte o andamento atual dos programas e a ocupacao de vagas.
              </p>
            </div>
            <p class="text-sm text-ink/60">
              {{ programsStore.programs.length }} programa(s) cadastrados
            </p>
          </div>

          <div class="mt-5">
            <DataTable
              :columns="columns"
              :items="programsStore.programs"
              empty-message="Nenhum programa cadastrado."
            >
              <template #status="{ item }">
                <span class="rounded-full bg-forest/10 px-3 py-1 text-xs font-semibold text-forest">
                  {{ statusLabel(item.status) }}
                </span>
              </template>
              <template #vagasDisponiveis="{ item }">
                {{ item.vagasDisponiveis }} / {{ item.totalVagas }}
              </template>
              <template #dataFimInscricao="{ item }">
                {{ formatDate(item.dataFimInscricao) }}
              </template>
            </DataTable>
          </div>
        </div>
      </div>

      <div class="space-y-5">
        <div class="panel p-6">
          <div class="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <p class="text-xs font-semibold uppercase tracking-[0.28em] text-forest/60">Gestao de acessos</p>
              <h3 class="mt-2 font-display text-2xl text-ink">Perfis de usuario</h3>
              <p class="mt-2 text-sm leading-6 text-ink/65">
                Promova participantes, ative servidores e mantenha o time organizado sem editar o banco manualmente.
              </p>
            </div>
            <button class="action-button-secondary" @click="usersStore.fetchUsers()">
              Atualizar
            </button>
          </div>

          <div v-if="usersStore.items.length" class="mt-5 space-y-4">
            <article
              v-for="user in usersStore.items"
              :key="user.id"
              class="rounded-[24px] border border-line/70 bg-white p-5"
            >
              <div class="flex items-start justify-between gap-3">
                <div>
                  <p class="text-base font-semibold text-ink">{{ user.nome }}</p>
                  <p class="mt-1 text-sm text-ink/60">{{ user.email }}</p>
                </div>
                <span
                  class="rounded-full px-3 py-1 text-xs font-semibold"
                  :class="user.status === 'ativo' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'"
                >
                  {{ user.status }}
                </span>
              </div>

              <div class="mt-4 grid gap-3">
                <label class="space-y-2 text-sm">
                  <span class="font-medium text-ink/70">Perfil de acesso</span>
                  <select
                    class="field-input"
                    :value="user.tipo"
                    :disabled="isSelfManagerLocked(user)"
                    @change="handleRoleChange(user, $event.target.value)"
                  >
                    <option value="participante">Participante</option>
                    <option value="servidor">Servidor</option>
                    <option value="gestor">Gestor</option>
                  </select>
                </label>

                <label class="space-y-2 text-sm">
                  <span class="font-medium text-ink/70">Status da conta</span>
                  <select
                    class="field-input"
                    :value="user.status"
                    :disabled="isSelfManagerLocked(user)"
                    @change="handleStatusChange(user, $event.target.value)"
                  >
                    <option value="ativo">Ativo</option>
                    <option value="inativo">Inativo</option>
                    <option value="suspenso">Suspenso</option>
                  </select>
                </label>
              </div>

              <div class="mt-4 flex items-center justify-between gap-3 text-sm">
                <p class="text-ink/58">
                  {{ user.id === authStore.user?.id ? "Sua conta principal de gestor." : `Criado em ${formatDate(user.dataCriacao)}` }}
                </p>
                <span v-if="usersStore.savingUserId === user.id" class="text-forest">
                  Salvando...
                </span>
              </div>
            </article>
          </div>

          <div
            v-else
            class="mt-5 rounded-[24px] border border-dashed border-line bg-sand/35 px-5 py-10 text-center text-sm text-ink/60"
          >
            Nenhum usuario encontrado.
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed, onMounted } from "vue";
import dayjs from "dayjs";

import api from "@/services/api";
import { usePortalMetrics } from "@/composables/usePortalMetrics";
import AppHeader from "@/components/shell/AppHeader.vue";
import MetricCard from "@/components/ui/MetricCard.vue";
import DataTable from "@/components/ui/DataTable.vue";
import { useAuthStore } from "@/stores/auth";
import { useProgramsStore } from "@/stores/programs";
import { useUsersStore } from "@/stores/users";

const authStore = useAuthStore();
const programsStore = useProgramsStore();
const usersStore = useUsersStore();

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

function formatDate(value) {
  if (!value) {
    return "Nao informado";
  }

  return dayjs(value).format("DD/MM/YYYY");
}

function statusLabel(status) {
  const labels = {
    planejamento: "Planejamento",
    inscricoes_abertas: "Inscricoes abertas",
    inscricoes_fechadas: "Inscricoes fechadas",
    em_andamento: "Em andamento",
    finalizado: "Finalizado",
  };

  return labels[status] || status;
}

function isSelfManagerLocked(user) {
  return user.id === authStore.user?.id;
}

async function handleRoleChange(user, tipo) {
  if (tipo === user.tipo) {
    return;
  }

  try {
    await usersStore.updateUserRole(user.id, tipo);
  } catch (error) {
    window.alert(error.response?.data?.message || "Nao foi possivel atualizar o perfil.");
  }
}

async function handleStatusChange(user, status) {
  if (status === user.status) {
    return;
  }

  try {
    await usersStore.updateUserStatus(user.id, status);
  } catch (error) {
    window.alert(error.response?.data?.message || "Nao foi possivel atualizar o status.");
  }
}

onMounted(async () => {
  await Promise.all([loadPrograms(), usersStore.fetchUsers()]);
});
</script>

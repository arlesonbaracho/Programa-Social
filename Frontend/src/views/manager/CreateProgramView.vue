<template>
  <section class="space-y-4">
    <AppHeader
      eyebrow="Novo programa"
      title="Cadastrar programa social"
      subtitle="Defina o ciclo do programa, regras de elegibilidade e o fluxo de inscricao."
      :user-name="authStore.user?.nome || 'Gestor'"
      :user-role="authStore.userRole || 'gestor'"
    />

    <ProgramForm @submit="handleSubmit" @cancel="router.push({ name: 'manager-dashboard' })" />
  </section>
</template>

<script setup>
import { useRouter } from "vue-router";

import AppHeader from "@/components/shell/AppHeader.vue";
import ProgramForm from "@/components/forms/ProgramForm.vue";
import { useAuthStore } from "@/stores/auth";
import { useProgramsStore } from "@/stores/programs";

const authStore = useAuthStore();
const programsStore = useProgramsStore();
const router = useRouter();

async function handleSubmit(payload) {
  await programsStore.createProgram(payload);
  router.push({ name: "manager-dashboard" });
}
</script>

<template>
  <div class="min-h-screen px-4 py-4 md:px-6">
    <div class="mx-auto grid min-h-[calc(100vh-2rem)] max-w-7xl gap-4 lg:grid-cols-[280px_1fr]">
      <AppSidebar
        class="hidden lg:flex"
        :title="portalTitle"
        :items="navigationItems"
        @logout="handleLogout"
      />

      <div class="flex flex-col gap-4">
        <div class="panel flex items-center justify-between p-4 lg:hidden">
          <div>
            <p class="text-xs uppercase tracking-[0.28em] text-forest/60">Portal</p>
            <p class="font-display text-2xl text-forest">{{ portalTitle }}</p>
          </div>
          <button class="action-button-secondary" @click="handleLogout">Sair</button>
        </div>

        <RouterView />
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";
import { useRouter } from "vue-router";

import AppSidebar from "@/components/shell/AppSidebar.vue";
import { useAuthStore } from "@/stores/auth";

const authStore = useAuthStore();
const router = useRouter();

const navigationMap = {
  participante: [
    { label: "Painel", to: { name: "participant-dashboard" } },
  ],
  servidor: [
    { label: "Painel", to: { name: "server-dashboard" } },
  ],
  gestor: [
    { label: "Painel", to: { name: "manager-dashboard" } },
    { label: "Novo programa", to: { name: "create-program" } },
  ],
};

const titleMap = {
  participante: "Participante",
  servidor: "Servidor",
  gestor: "Gestor",
};

const navigationItems = computed(
  () => navigationMap[authStore.userRole] || navigationMap.participante,
);

const portalTitle = computed(
  () => titleMap[authStore.userRole] || "Participante",
);

async function handleLogout() {
  await authStore.logout();
  router.push({ name: "login" });
}
</script>

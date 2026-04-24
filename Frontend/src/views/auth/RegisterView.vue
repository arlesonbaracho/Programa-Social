<template>
  <main class="flex min-h-screen items-center justify-center px-4 py-10">
    <section class="panel w-full max-w-2xl p-8">
      <p class="text-xs uppercase tracking-[0.28em] text-clay">Cadastro do participante</p>
      <h1 class="mt-3 font-display text-3xl text-ink">Criar conta</h1>
      <p class="mt-2 text-sm text-ink/68">
        Use este cadastro para acompanhar programas e inscricoes sociais.
      </p>

      <form class="mt-8 grid gap-4 md:grid-cols-2" @submit.prevent="handleRegister">
        <label class="space-y-2 text-sm md:col-span-2">
          <span class="font-medium text-ink/75">Nome completo</span>
          <input v-model="form.nome" class="field-input" required />
        </label>
        <label class="space-y-2 text-sm">
          <span class="font-medium text-ink/75">Email</span>
          <input v-model="form.email" type="email" class="field-input" required />
        </label>
        <label class="space-y-2 text-sm">
          <span class="font-medium text-ink/75">CPF</span>
          <input v-model="form.cpf" maxlength="11" class="field-input" />
        </label>
        <label class="space-y-2 text-sm">
          <span class="font-medium text-ink/75">Telefone</span>
          <input v-model="form.telefone" class="field-input" />
        </label>
        <label class="space-y-2 text-sm">
          <span class="font-medium text-ink/75">Data de nascimento</span>
          <input v-model="form.dataNascimento" type="date" class="field-input" />
        </label>
        <label class="space-y-2 text-sm md:col-span-2">
          <span class="font-medium text-ink/75">Senha</span>
          <input v-model="form.senha" type="password" class="field-input" required />
        </label>

        <p v-if="authStore.errorMessage" class="rounded-2xl bg-red-100 px-4 py-3 text-sm text-red-700 md:col-span-2">
          {{ authStore.errorMessage }}
        </p>

        <div class="flex items-center justify-between gap-3 md:col-span-2">
          <RouterLink class="action-button-secondary" :to="{ name: 'login' }">
            Voltar
          </RouterLink>
          <button class="action-button-primary" :disabled="authStore.loading">
            {{ authStore.loading ? 'Salvando...' : 'Criar conta' }}
          </button>
        </div>
      </form>
    </section>
  </main>
</template>

<script setup>
import { reactive } from "vue";
import { useRouter } from "vue-router";

import { useAuthStore } from "@/stores/auth";

const authStore = useAuthStore();
const router = useRouter();

const form = reactive({
  nome: "",
  email: "",
  cpf: "",
  telefone: "",
  dataNascimento: "",
  senha: "",
});

async function handleRegister() {
  await authStore.register(form);
  router.push({ name: "participant-dashboard" });
}
</script>

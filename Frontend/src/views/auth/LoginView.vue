<template>
  <main class="flex min-h-screen items-center justify-center px-4 py-10">
    <div class="grid w-full max-w-6xl gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <section class="panel flex flex-col justify-between gap-8 overflow-hidden p-8">
        <div>
          <p class="text-xs uppercase tracking-[0.34em] text-clay">Gestao social municipal</p>
          <h1 class="mt-4 max-w-xl font-display text-5xl leading-tight text-forest">
            Um portal unico para programas, inscricoes e acompanhamento publico.
          </h1>
          <p class="mt-5 max-w-2xl text-base text-ink/72">
            Gestores, servidores e participantes acessam a mesma plataforma com
            fluxos distintos, rastreabilidade de operacoes e comunicacao integrada.
          </p>
        </div>

        <div class="grid gap-4 md:grid-cols-3">
          <article class="rounded-3xl bg-white/70 p-5">
            <p class="text-sm font-semibold text-forest">Participante</p>
            <p class="mt-2 text-sm text-ink/65">Consulta programas, realiza inscricoes e acompanha notificacoes.</p>
          </article>
          <article class="rounded-3xl bg-white/70 p-5">
            <p class="text-sm font-semibold text-forest">Servidor</p>
            <p class="mt-2 text-sm text-ink/65">Analisa demandas, aprova inscricoes e monitora filas operacionais.</p>
          </article>
          <article class="rounded-3xl bg-white/70 p-5">
            <p class="text-sm font-semibold text-forest">Gestor</p>
            <p class="mt-2 text-sm text-ink/65">Cria programas, acompanha indicadores e gerencia a rede de atendimento.</p>
          </article>
        </div>
      </section>

      <section class="panel p-8">
        <div class="mx-auto max-w-md">
          <p class="text-xs uppercase tracking-[0.28em] text-forest/55">Acesso seguro</p>
          <h2 class="mt-3 font-display text-3xl text-ink">Entrar no sistema</h2>
          <p class="mt-2 text-sm text-ink/65">
            Use seu email institucional ou cadastro de participante.
          </p>

          <form class="mt-8 space-y-4" @submit.prevent="handleLogin">
            <label class="space-y-2 text-sm">
              <span class="font-medium text-ink/75">Email</span>
              <input v-model="form.email" type="email" class="field-input" required />
            </label>
            <label class="space-y-2 text-sm">
              <span class="font-medium text-ink/75">Senha</span>
              <input v-model="form.senha" type="password" class="field-input" required />
            </label>

            <p v-if="authStore.errorMessage" class="rounded-2xl bg-red-100 px-4 py-3 text-sm text-red-700">
              {{ authStore.errorMessage }}
            </p>

            <button class="action-button-primary w-full" :disabled="authStore.loading">
              {{ authStore.loading ? 'Entrando...' : 'Acessar portal' }}
            </button>
          </form>

          <p class="mt-6 text-sm text-ink/65">
            Ainda nao possui conta?
            <RouterLink class="font-semibold text-forest" :to="{ name: 'register' }">
              Criar cadastro
            </RouterLink>
          </p>
        </div>
      </section>
    </div>
  </main>
</template>

<script setup>
import { reactive } from "vue";
import { useRouter } from "vue-router";

import { useAuthStore } from "@/stores/auth";

const authStore = useAuthStore();
const router = useRouter();

const form = reactive({
  email: "",
  senha: "",
});

function resolveHome(role) {
  if (role === "gestor") {
    return { name: "manager-dashboard" };
  }

  if (role === "servidor") {
    return { name: "server-dashboard" };
  }

  return { name: "participant-dashboard" };
}

async function handleLogin() {
  const user = await authStore.login(form);
  router.push(resolveHome(user.tipo));
}
</script>

<template>
  <aside class="panel flex h-full flex-col gap-4 p-5">
    <div>
      <p class="text-xs uppercase tracking-[0.3em] text-forest/60">Portal</p>
      <h1 class="mt-2 font-display text-2xl font-semibold text-forest">
        {{ title }}
      </h1>
    </div>

    <nav class="flex flex-1 flex-col gap-2">
      <RouterLink
        v-for="item in items"
        :key="item.to.name"
        :to="item.to"
        class="rounded-2xl px-4 py-3 text-sm font-medium transition"
        :class="
          route.name === item.to.name
            ? 'bg-forest text-white'
            : 'bg-white/60 text-ink hover:bg-white'
        "
      >
        {{ item.label }}
      </RouterLink>
    </nav>

    <button class="action-button-secondary w-full" @click="$emit('logout')">
      Encerrar sessao
    </button>
  </aside>
</template>

<script setup>
import { useRoute } from "vue-router";

defineProps({
  title: {
    type: String,
    required: true,
  },
  items: {
    type: Array,
    required: true,
  },
});

defineEmits(["logout"]);

const route = useRoute();
</script>

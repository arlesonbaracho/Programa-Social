<template>
  <header class="panel flex flex-col gap-5 p-6 md:flex-row md:items-center md:justify-between">
    <div>
      <p class="text-xs font-semibold uppercase tracking-[0.3em] text-forest/60">{{ eyebrow }}</p>
      <h2 class="mt-2 font-display text-3xl text-ink md:text-4xl">{{ title }}</h2>
      <p class="mt-3 max-w-2xl text-sm leading-6 text-ink/68">{{ subtitle }}</p>
    </div>

    <div class="rounded-3xl border border-line/70 bg-sand/55 px-4 py-3 text-sm text-ink/72">
      <p class="font-semibold text-ink">{{ userName }}</p>
      <p class="mt-1 capitalize text-forest">{{ userRole }}</p>
    </div>
  </header>
</template>

<script setup>
defineProps({
  eyebrow: {
    type: String,
    default: "Acompanhamento",
  },
  title: {
    type: String,
    required: true,
  },
  subtitle: {
    type: String,
    default: "",
  },
  userName: {
    type: String,
    required: true,
  },
  userRole: {
    type: String,
    required: true,
  },
});
</script>

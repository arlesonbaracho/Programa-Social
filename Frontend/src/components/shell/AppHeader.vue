<template>
  <header class="panel flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between">
    <div>
      <p class="text-xs uppercase tracking-[0.3em] text-forest/55">{{ eyebrow }}</p>
      <h2 class="mt-2 font-display text-3xl text-ink">{{ title }}</h2>
      <p class="mt-2 max-w-2xl text-sm text-ink/70">{{ subtitle }}</p>
    </div>

    <div class="rounded-2xl bg-white/70 px-4 py-3 text-sm text-ink/70">
      <p class="font-semibold text-ink">{{ userName }}</p>
      <p class="capitalize">{{ userRole }}</p>
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

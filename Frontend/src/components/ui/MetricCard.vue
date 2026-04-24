<template>
  <article class="panel p-5">
    <p class="text-xs uppercase tracking-[0.28em] text-forest/55">{{ label }}</p>
    <p class="mt-4 font-display text-4xl text-ink">{{ value }}</p>
    <p class="mt-2 text-sm text-ink/65">{{ hint }}</p>
  </article>
</template>

<script setup>
defineProps({
  label: {
    type: String,
    required: true,
  },
  value: {
    type: [String, Number],
    required: true,
  },
  hint: {
    type: String,
    default: "",
  },
});
</script>

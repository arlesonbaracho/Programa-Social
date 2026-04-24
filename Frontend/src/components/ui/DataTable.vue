<template>
  <div class="panel overflow-hidden">
    <div class="overflow-x-auto">
      <table class="min-w-full divide-y divide-line/60">
        <thead class="bg-sand/60">
          <tr>
            <th
              v-for="column in columns"
              :key="column.key"
              class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.2em] text-forest/60"
            >
              {{ column.label }}
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-line/40 bg-white/65">
          <tr v-if="items.length === 0">
            <td
              :colspan="columns.length"
              class="px-4 py-6 text-center text-sm text-ink/55"
            >
              {{ emptyMessage }}
            </td>
          </tr>
          <tr v-for="item in items" :key="item[rowKey]" class="hover:bg-white/80">
            <td
              v-for="column in columns"
              :key="column.key"
              class="px-4 py-4 text-sm text-ink/80"
            >
              <slot :name="column.key" :item="item">
                {{ item[column.key] }}
              </slot>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
defineProps({
  columns: {
    type: Array,
    required: true,
  },
  items: {
    type: Array,
    default: () => [],
  },
  rowKey: {
    type: String,
    default: "id",
  },
  emptyMessage: {
    type: String,
    default: "Nenhum registro encontrado.",
  },
});
</script>

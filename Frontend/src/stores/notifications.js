import { defineStore } from "pinia";
import { ref } from "vue";

import api from "@/services/api";

export const useNotificationsStore = defineStore("notifications", () => {
  const items = ref([]);
  const loading = ref(false);

  async function fetchNotifications() {
    loading.value = true;
    try {
      const response = await api.get("/notificacoes");
      items.value = response.data;
    } finally {
      loading.value = false;
    }
  }

  async function markAsRead(id) {
    await api.put(`/notificacoes/${id}/ler`);
    const target = items.value.find((item) => item.id === id);
    if (target) {
      target.lido = true;
    }
  }

  return {
    items,
    loading,
    fetchNotifications,
    markAsRead,
  };
});

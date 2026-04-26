import { computed, ref } from "vue";
import { defineStore } from "pinia";

import api from "@/services/api";

export const useUsersStore = defineStore("users", () => {
  const items = ref([]);
  const loading = ref(false);
  const savingUserId = ref(null);

  const activeUsers = computed(() =>
    items.value.filter((user) => user.status === "ativo"),
  );

  async function fetchUsers(params = {}) {
    loading.value = true;
    try {
      const response = await api.get("/usuarios", { params });
      items.value = response.data;
      return response.data;
    } finally {
      loading.value = false;
    }
  }

  async function updateUserRole(id, tipo) {
    savingUserId.value = id;
    try {
      const response = await api.put(`/usuarios/${id}/tipo`, { tipo });
      replaceUser(response.data);
      return response.data;
    } finally {
      savingUserId.value = null;
    }
  }

  async function updateUserStatus(id, status) {
    savingUserId.value = id;
    try {
      const response = await api.put(`/usuarios/${id}/status`, { status });
      replaceUser(response.data);
      return response.data;
    } finally {
      savingUserId.value = null;
    }
  }

  function replaceUser(user) {
    const index = items.value.findIndex((item) => item.id === user.id);
    if (index >= 0) {
      items.value.splice(index, 1, user);
      return;
    }

    items.value.unshift(user);
  }

  return {
    items,
    loading,
    savingUserId,
    activeUsers,
    fetchUsers,
    updateUserRole,
    updateUserStatus,
  };
});

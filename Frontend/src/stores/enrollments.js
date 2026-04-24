import { defineStore } from "pinia";
import { ref } from "vue";

import api from "@/services/api";

export const useEnrollmentsStore = defineStore("enrollments", () => {
  const items = ref([]);
  const loading = ref(false);

  async function fetchMyEnrollments() {
    loading.value = true;
    try {
      const response = await api.get("/inscricoes");
      items.value = response.data;
    } finally {
      loading.value = false;
    }
  }

  async function createEnrollment(payload) {
    const response = await api.post("/inscricoes", payload);
    items.value.unshift(response.data);
    return response.data;
  }

  async function approveEnrollment(id) {
    const response = await api.put(`/inscricoes/${id}/aprovar`);
    await fetchMyEnrollments();
    return response.data;
  }

  async function rejectEnrollment(id, payload) {
    const response = await api.put(`/inscricoes/${id}/rejeitar`, payload);
    await fetchMyEnrollments();
    return response.data;
  }

  return {
    items,
    loading,
    fetchMyEnrollments,
    createEnrollment,
    approveEnrollment,
    rejectEnrollment,
  };
});

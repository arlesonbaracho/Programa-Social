import { computed, ref } from "vue";
import { defineStore } from "pinia";

import api from "@/services/api";

export const useProgramsStore = defineStore("programs", () => {
  const programs = ref([]);
  const loading = ref(false);
  const selectedProgram = ref(null);

  const openPrograms = computed(() =>
    programs.value.filter((program) => program.status === "inscricoes_abertas"),
  );

  async function fetchPrograms(params = {}) {
    loading.value = true;
    try {
      const response = await api.get("/programas", { params });
      programs.value = response.data;
    } finally {
      loading.value = false;
    }
  }

  async function fetchProgramById(id) {
    const response = await api.get(`/programas/${id}`);
    selectedProgram.value = response.data;
    return response.data;
  }

  async function createProgram(payload) {
    const response = await api.post("/programas", payload);
    programs.value.unshift(response.data);
    return response.data;
  }

  return {
    programs,
    loading,
    selectedProgram,
    openPrograms,
    fetchPrograms,
    fetchProgramById,
    createProgram,
  };
});

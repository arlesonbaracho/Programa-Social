import { computed, ref } from "vue";
import { defineStore } from "pinia";

import api from "@/services/api";
import {
  clearSession,
  getAccessToken,
  getRefreshToken,
  getStoredUser,
  setSession,
} from "@/services/token.service";

export const useAuthStore = defineStore("auth", () => {
  const user = ref(getStoredUser());
  const accessToken = ref(getAccessToken());
  const refreshToken = ref(getRefreshToken());
  const loading = ref(false);
  const errorMessage = ref("");

  const isAuthenticated = computed(() => Boolean(accessToken.value && user.value));
  const userRole = computed(() => user.value?.tipo || null);

  function updateSession(payload) {
    user.value = payload.user;
    accessToken.value = payload.tokens.accessToken;
    refreshToken.value = payload.tokens.refreshToken;
    setSession({
      accessToken: payload.tokens.accessToken,
      refreshToken: payload.tokens.refreshToken,
      user: payload.user,
    });
  }

  async function login(credentials) {
    loading.value = true;
    errorMessage.value = "";

    try {
      const response = await api.post("/auth/login", credentials);
      updateSession(response.data);
      return response.data.user;
    } catch (error) {
      errorMessage.value =
        error.response?.data?.message || "Nao foi possivel autenticar.";
      throw error;
    } finally {
      loading.value = false;
    }
  }

  async function register(payload) {
    loading.value = true;
    errorMessage.value = "";

    try {
      const response = await api.post("/auth/registrar", payload);
      updateSession(response.data);
      return response.data.user;
    } catch (error) {
      errorMessage.value =
        error.response?.data?.message || "Nao foi possivel criar a conta.";
      throw error;
    } finally {
      loading.value = false;
    }
  }

  async function logout() {
    const refresh = refreshToken.value;
    clearSession();
    user.value = null;
    accessToken.value = null;
    refreshToken.value = null;
    errorMessage.value = "";

    if (refresh) {
      try {
        await api.post("/auth/logout", { refreshToken: refresh });
      } catch {
        // Silent logout when backend is unavailable.
      }
    }
  }

  return {
    user,
    accessToken,
    refreshToken,
    loading,
    errorMessage,
    isAuthenticated,
    userRole,
    login,
    register,
    logout,
  };
});

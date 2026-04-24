import axios from "axios";

import { appConfig } from "@/config/env";
import { clearSession, getAccessToken, getRefreshToken, setSession } from "@/services/token.service";

const api = axios.create({
  baseURL: appConfig.apiBaseUrl,
  timeout: 10000,
});

let refreshPromise = null;

api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      getRefreshToken()
    ) {
      originalRequest._retry = true;

      if (!refreshPromise) {
        refreshPromise = api
          .post("/auth/refresh-token", {
            refreshToken: getRefreshToken(),
          })
          .then((response) => {
            setSession({
              accessToken: response.data.tokens.accessToken,
              refreshToken: response.data.tokens.refreshToken,
              user: response.data.user,
            });
            return response.data.tokens.accessToken;
          })
          .catch((refreshError) => {
            clearSession();
            throw refreshError;
          })
          .finally(() => {
            refreshPromise = null;
          });
      }

      const newToken = await refreshPromise;
      originalRequest.headers.Authorization = `Bearer ${newToken}`;
      return api(originalRequest);
    }

    return Promise.reject(error);
  },
);

export default api;

import axios from "axios";
import i18n from "../i18n.js";

const baseURL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export const apiClient = axios.create({ baseURL });

// Attach the JWT + language to every outgoing request once we have one (next step).
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("gc_access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  // Backend only understands ar/fr — map English → fr as a fallback.
  config.headers["Accept-Language"] = i18n.language === "ar" ? "ar" : "fr";
  return config;
});

apiClient.interceptors.response.use(
  (res) => res,
  async (error) => {
    const originalRequest = error.config;

    const isAuthEndpoint =
      originalRequest?.url?.includes("/auth/login") ||
      originalRequest?.url?.includes("/auth/refresh");

    if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
      originalRequest._retry = true;
      try {
        const refreshToken = localStorage.getItem("gc_refresh_token");
        if (!refreshToken) {
          window.location.href = "/login";
          return Promise.reject(error);
        }
        const res = await apiClient.post("/auth/refresh", { refreshToken });
        const { accessToken } = res.data;

        localStorage.setItem("gc_access_token", accessToken);
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem("gc_access_token");
        localStorage.removeItem("gc_refresh_token");
        window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);
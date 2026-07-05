import axios from "axios";

const baseURL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export const apiClient = axios.create({ baseURL });

// Attach the JWT to every outgoing request once we have one (next step).
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("gc_access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (res) => res,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = localStorage.getItem("gc_refresh_token");
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
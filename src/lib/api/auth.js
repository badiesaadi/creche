// src/lib/api/auth.js
import { apiClient } from "./client.js";
import { userFromApi } from "./adapters.js";

export async function login(email, password) {
  const res = await apiClient.post("/auth/login", { email, password });
  const { user, accessToken, refreshToken } = res.data.data;
  return { user: userFromApi(user), accessToken, refreshToken };
}

export async function fetchMe() {
  const res = await apiClient.get("/auth/me");
  return userFromApi(res.data.data);
}

export async function logoutApi() {
  await apiClient.post("/auth/logout");
}

export async function changePassword(currentPassword, newPassword) {
  await apiClient.post("/auth/change-password", { currentPassword, newPassword });
}

export async function resetPassword(userId, newPassword) {
  await apiClient.post("/auth/reset-password", { userId, newPassword });
}

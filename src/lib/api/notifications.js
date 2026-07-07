// src/lib/api/notifications.js
import { apiClient } from "./client.js";
import { notificationFromApi } from "./adapters.js";

export async function fetchNotifications() {
  const res = await apiClient.get("/notifications");
  const list = Array.isArray(res.data.data) ? res.data.data : res.data.data?.items || [];
  return list.map(notificationFromApi);
}

export async function createNotification({ userId, crecheId, type, title, message }) {
  const res = await apiClient.post("/notifications", { userId, crecheId, type, title, message });
  return res.data.data;
}

export async function markNotificationRead(id) {
  await apiClient.patch(`/notifications/${id}/read`);
}

export async function markAllNotificationsRead() {
  await apiClient.patch("/notifications/read-all");
}

export async function deleteNotification(id) {
  await apiClient.delete(`/notifications/${id}`);
}

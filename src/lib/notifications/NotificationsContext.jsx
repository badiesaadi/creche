import { createContext, useContext, useState } from "react";
import { mockNotifications } from "../../data/mockNotifications.js";

const NotificationsContext = createContext(null);

export function NotificationsProvider({ children }) {
  // TODO: replace with real API call -> apiClient.get("/notifications")
  const [notifications, setNotifications] = useState(mockNotifications);

  const unreadCount = notifications.filter((n) => !n.read).length;

  function markAsRead(id) {
    // TODO: replace with real API call -> apiClient.patch(`/notifications/${id}/read`)
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  }

  function markAllAsRead() {
    // TODO: replace with real API call -> apiClient.post("/notifications/read-all")
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }

  return (
    <NotificationsContext.Provider value={{ notifications, unreadCount, markAsRead, markAllAsRead }}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  return useContext(NotificationsContext);
}
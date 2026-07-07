import { createContext, useContext, useState, useEffect } from "react";
import { fetchNotifications, markNotificationRead, markAllNotificationsRead, deleteNotification } from "../api/notifications.js";
import { useAuth } from "../auth/AuthContext.jsx";

const NotificationsContext = createContext(null);

export function NotificationsProvider({ children }) {
  const { user } = useAuth() || {};
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      return;
    }
    fetchNotifications()
      .then(setNotifications)
      .catch(() => setNotifications([]));
  }, [user]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  function markAsRead(id) {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    markNotificationRead(id).catch(() => {});
  }

  function markAllAsRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    markAllNotificationsRead().catch(() => {});
  }

  function remove(id) {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    deleteNotification(id).catch(() => {});
  }

  return (
    <NotificationsContext.Provider value={{ notifications, unreadCount, markAsRead, markAllAsRead, remove }}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  return useContext(NotificationsContext);
}

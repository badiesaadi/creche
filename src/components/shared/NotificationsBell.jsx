import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useNotifications } from "../../lib/notifications/NotificationsContext.jsx";

const typeLabels = {
  payment_overdue: "DZD",
  absence_threshold: "ABS",
  contract_expiry: "CTR",
  reminder_sent: "ENV",
};

export default function NotificationsBell() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleNotificationClick(n) {
    markAsRead(n.id);
    setOpen(false);
    navigate(n.link);
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="relative p-2 rounded-md text-gray-500 hover:bg-gray-100"
        aria-label="Notifications"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute top-1 end-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute end-0 top-10 z-50 w-80 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <span className="font-semibold text-gray-800 text-sm">
              {t("notifications.title")}
              {unreadCount > 0 && (
                <span className="ms-2 bg-red-50 text-red-600 text-xs px-2 py-0.5 rounded-full">
                  {unreadCount}
                </span>
              )}
            </span>
            {unreadCount > 0 && (
              <button onClick={markAllAsRead} className="text-xs text-teal-600 hover:underline">
                {t("notifications.markAllRead")}
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
            {notifications.length === 0 ? (
              <p className="text-center text-gray-400 text-sm py-8">{t("notifications.empty")}</p>
            ) : (
              notifications.map((n) => (
                <button
                  key={n.id}
                  onClick={() => handleNotificationClick(n)}
                  className={`w-full text-start px-4 py-3 hover:bg-gray-50 transition-colors ${!n.read ? "bg-teal-50/50" : ""}`}
                >
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 shrink-0 w-8 h-8 rounded-md bg-teal-50 text-teal-700 text-xs font-bold flex items-center justify-center">
                      {typeLabels[n.type] || "!"}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm leading-snug ${!n.read ? "font-medium text-gray-800" : "text-gray-600"}`}>
                        {n.message}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">{n.date}</p>
                    </div>
                    {!n.read && <span className="w-2 h-2 rounded-full bg-teal-500 mt-1.5 shrink-0" />}
                  </div>
                </button>
              ))
            )}
          </div>

          <div className="border-t border-gray-100 px-4 py-2">
            <button
              onClick={() => { setOpen(false); navigate("/creche/notifications"); }}
              className="text-xs text-teal-600 hover:underline w-full text-center"
            >
              {t("notifications.viewAll")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

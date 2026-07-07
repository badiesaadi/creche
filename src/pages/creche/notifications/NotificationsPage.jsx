import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useNotifications } from "../../../lib/notifications/NotificationsContext.jsx";

const typeLabels = {
  payment_overdue: "DZD",
  absence_threshold: "ABS",
  contract_expiry: "CTR",
  reminder_sent: "ENV",
};

export default function NotificationsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { notifications, markAsRead, markAllAsRead, remove } = useNotifications();

  const unreadCount = notifications.filter((n) => !n.read).length;

  function handleClick(n) {
    markAsRead(n.id);
    navigate(n.link);
  }

  return (
    <div className="space-y-5 max-w-2xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className="text-xl font-bold text-gray-800">{t("notifications.title")}</h1>
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="text-sm text-teal-600 hover:underline w-full sm:w-auto text-start sm:text-end"
          >
            {t("notifications.markAllRead")}
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center text-gray-400">
          {t("notifications.empty")}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 divide-y divide-gray-100">
          {notifications.map((n) => (
            <div
              key={n.id}
              className={`w-full flex items-start gap-2 px-5 py-4 hover:bg-gray-50 transition-colors ${!n.read ? "bg-teal-50/40" : ""}`}
            >
              <button onClick={() => handleClick(n)} className="flex-1 text-start flex items-start gap-4 min-w-0">
                <span className="mt-0.5 shrink-0 w-9 h-9 rounded-md bg-teal-50 text-teal-700 text-xs font-bold flex items-center justify-center">
                  {typeLabels[n.type] || "!"}
                </span>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm leading-snug ${!n.read ? "font-semibold text-gray-800" : "text-gray-600"}`}>
                    {n.message}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">{n.date}</p>
                </div>
                {!n.read && <span className="w-2.5 h-2.5 rounded-full bg-teal-500 mt-1.5 shrink-0" />}
              </button>
              <button
                onClick={() => remove(n.id)}
                title={t("notifications.delete")}
                className="shrink-0 text-gray-300 hover:text-red-500 text-lg leading-none px-1 py-1"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { fetchLatePayments } from "../../../lib/api/payments.js";
import { fetchChildren } from "../../../lib/api/children.js";
import { createNotification } from "../../../lib/api/notifications.js";

export default function RemindersPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sentIds, setSentIds] = useState({});

  useEffect(() => {
    Promise.all([fetchLatePayments(), fetchChildren()])
      .then(([late, children]) => {
        const byId = Object.fromEntries(children.map((c) => [c.id, `${c.prenom} ${c.nom}`]));
        setReminders(late.map((p) => ({ ...p, childName: byId[p.childId] || p.childId })));
      })
      .catch((err) => setError(err.response?.data?.message || t("common.error")))
      .finally(() => setLoading(false));
  }, [t]);

  // The backend has no dedicated "send payment reminder" endpoint — the
  // closest real action is posting a GENERAL notification.
  async function handleTrigger(reminder) {
    try {
      await createNotification({
        type: "GENERAL",
        title: t("payments.sendReminder"),
        message: t("payments.notSent") + " — " + reminder.childName,
      });
      setSentIds((prev) => ({ ...prev, [reminder.id]: new Date().toISOString().slice(0, 10) }));
    } catch (err) {
      setError(err.response?.data?.message || t("common.error"));
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate("/creche/payments")} className="text-gray-400 hover:text-gray-600">
          ←
        </button>
        <h1 className="text-xl font-bold text-gray-800">{t("payments.reminders")}</h1>
      </div>

      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-2">{error}</p>}
      {loading && <p className="text-gray-400 text-sm">{t("common.loading")}</p>}

      <div className="space-y-3">
        {reminders.map((r) => {
          const sentDate = sentIds[r.id];
          return (
            <div key={r.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <p className="font-medium text-gray-800">{r.childName}</p>
                <p className="text-sm text-gray-500">
                  {sentDate ? t("payments.sentOn", { date: sentDate }) : t("payments.notSent")}
                </p>
              </div>

              {sentDate ? (
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 self-start sm:self-center">
                  {t("payments.sent")}
                </span>
              ) : (
                <button
                  onClick={() => handleTrigger(r)}
                  className="px-4 py-2 rounded-md bg-teal-600 text-white text-sm font-medium hover:bg-teal-700 w-full sm:w-auto"
                >
                  {t("payments.sendReminder")}
                </button>
              )}
            </div>
          );
        })}

        {!loading && reminders.length === 0 && (
          <p className="text-center text-gray-400 py-12">{t("common.noResults")}</p>
        )}
      </div>
    </div>
  );
}

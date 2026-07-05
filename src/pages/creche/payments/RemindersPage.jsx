import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { mockReminders } from "../../../data/mockPayments.js";

export default function RemindersPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  // TODO: replace with real API call -> apiClient.get("/payments/reminders")
  const [reminders, setReminders] = useState(mockReminders);

  function handleTrigger(reminderId) {
    // TODO: replace with real API call -> apiClient.post(`/payments/reminders/${reminderId}/send`)
    setReminders((prev) =>
      prev.map((r) =>
        r.id === reminderId
          ? { ...r, status: "envoye", sentDate: new Date().toISOString().slice(0, 10) }
          : r
      )
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate("/creche/payments")} className="text-gray-400 hover:text-gray-600">
          ←
        </button>
        <h1 className="text-xl font-bold text-gray-800">{t("payments.reminders")}</h1>
      </div>

      <div className="space-y-3">
        {reminders.map((r) => (
          <div key={r.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <p className="font-medium text-gray-800">{r.childName}</p>
              <p className="text-sm text-gray-500">
                {r.status === "envoye"
                  ? t("payments.sentOn", { date: r.sentDate })
                  : t("payments.notSent")}
              </p>
            </div>

            {r.status === "envoye" ? (
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 self-start sm:self-center">
                {t("payments.sent")}
              </span>
            ) : (
              <button
                onClick={() => handleTrigger(r.id)}
                className="px-4 py-2 rounded-md bg-teal-600 text-white text-sm font-medium hover:bg-teal-700 w-full sm:w-auto"
              >
                {t("payments.sendReminder")}
              </button>
            )}
          </div>
        ))}

        {reminders.length === 0 && (
          <p className="text-center text-gray-400 py-12">{t("common.noResults")}</p>
        )}
      </div>
    </div>
  );
}
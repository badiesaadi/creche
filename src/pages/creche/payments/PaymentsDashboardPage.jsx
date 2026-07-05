import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { mockPayments, mockReminders } from "../../../data/mockPayments.js";

export default function PaymentsDashboardPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  // TODO: replace with real API calls
  const [payments] = useState(mockPayments);
  const [reminders, setReminders] = useState(mockReminders);
  const [statusFilter, setStatusFilter] = useState("tous");

  const totalCollected = payments.filter((p) => p.statut === "paye").reduce((sum, p) => sum + p.montant, 0);
  const totalOverdue = payments.filter((p) => p.statut === "en_retard").reduce((sum, p) => sum + p.montant, 0);
  const overdueCount = payments.filter((p) => p.statut === "en_retard").length;

  const filtered = payments.filter((p) => statusFilter === "tous" || p.statut === statusFilter);

  // Auto-reminder: overdue payments that have no reminder sent yet
  const overdueWithoutReminder = payments
    .filter((p) => p.statut === "en_retard")
    .filter((p) => !reminders.find((r) => r.paymentId === p.id && r.status === "envoye"));

  function handleAutoReminder() {
    // TODO: replace with real API call -> apiClient.post("/payments/reminders/auto")
    setReminders((prev) =>
      prev.map((r) =>
        r.status === "non_envoye"
          ? { ...r, status: "envoye", sentDate: new Date().toISOString().slice(0, 10) }
          : r
      )
    );
    alert(t("payments.autoReminderSent", { count: overdueWithoutReminder.length }));
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className="text-xl font-bold text-gray-800">{t("nav.payments")}</h1>
        <button
          onClick={() => navigate("/creche/payments/nouveau")}
          className="bg-teal-600 text-white rounded-md px-4 py-2 text-sm font-medium hover:bg-teal-700 w-full sm:w-auto"
        >
          + {t("payments.recordPayment")}
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label={t("payments.totalCollected")} value={`${totalCollected.toLocaleString()} DZD`} color="text-green-600" />
        <StatCard label={t("payments.totalOverdue")} value={`${totalOverdue.toLocaleString()} DZD`} color="text-red-600" />
        <StatCard label={t("payments.overdueCount")} value={overdueCount} color="text-yellow-600" />
      </div>

      {/* Auto-reminder banner */}
      {overdueWithoutReminder.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <p className="text-sm text-yellow-800">
            {t("payments.autoReminderBanner", { count: overdueWithoutReminder.length })}
          </p>
          <button
            onClick={handleAutoReminder}
            className="w-full sm:w-auto px-4 py-2 rounded-md bg-yellow-500 text-white text-sm font-medium hover:bg-yellow-600"
          >
            {t("payments.triggerAutoReminder")}
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-full sm:w-56 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
        >
          <option value="tous">{t("payments.allStatuses")}</option>
          <option value="paye">{t("children.paid")}</option>
          <option value="en_retard">{t("children.overdue")}</option>
        </select>
        <button
          onClick={() => navigate("/creche/payments/rappels")}
          className="w-full sm:w-auto px-4 py-2 rounded-md border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50"
        >
          {t("payments.viewReminders")}
        </button>
      </div>

      {/* Desktop table */}
      <div className="hidden md:block bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
            <tr>
              <th className="text-start px-4 py-3">{t("children.fullName")}</th>
              <th className="text-start px-4 py-3">{t("children.date")}</th>
              <th className="text-start px-4 py-3">{t("children.amount")}</th>
              <th className="text-start px-4 py-3">{t("children.method")}</th>
              <th className="text-start px-4 py-3">{t("children.status")}</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr key={p.id} className="border-t border-gray-100 hover:bg-gray-50">
                <td
                  className="px-4 py-3 font-medium text-gray-800 cursor-pointer hover:text-teal-700"
                  onClick={() => navigate(`/creche/enfants/${p.childId}`)}
                >
                  {p.childName}
                </td>
                <td className="px-4 py-3 text-gray-600">{p.date}</td>
                <td className="px-4 py-3 text-gray-800">{p.montant.toLocaleString()} DZD</td>
                <td className="px-4 py-3 text-gray-600">{p.methode}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    p.statut === "paye" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"
                  }`}>
                    {p.statut === "paye" ? t("children.paid") : t("children.overdue")}
                  </span>
                </td>
                <td className="px-4 py-3 text-end">
                  <button
                    onClick={() => navigate(`/creche/payments/schedule/${p.childId}`)}
                    className="text-xs text-teal-600 hover:underline"
                  >
                    {t("payments.viewSchedule")}
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">{t("common.noResults")}</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {filtered.map((p) => (
          <div key={p.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-1">
              <button
                onClick={() => navigate(`/creche/enfants/${p.childId}`)}
                className="font-medium text-gray-800 hover:text-teal-700"
              >
                {p.childName}
              </button>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                p.statut === "paye" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"
              }`}>
                {p.statut === "paye" ? t("children.paid") : t("children.overdue")}
              </span>
            </div>
            <p className="text-sm text-gray-600">{p.montant.toLocaleString()} DZD · {p.methode}</p>
            <p className="text-xs text-gray-400 mt-1">{p.date}</p>
            <button
              onClick={() => navigate(`/creche/payments/schedule/${p.childId}`)}
              className="mt-2 text-xs text-teal-600 hover:underline"
            >
              {t("payments.viewSchedule")}
            </button>
          </div>
        ))}
        {filtered.length === 0 && <p className="text-center text-gray-400 py-8">{t("common.noResults")}</p>}
      </div>
    </div>
  );
}

function StatCard({ label, value, color }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
      <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">{label}</p>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
    </div>
  );
}
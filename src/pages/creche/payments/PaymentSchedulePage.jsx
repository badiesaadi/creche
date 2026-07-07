import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { fetchChild } from "../../../lib/api/children.js";
import { fetchChildPayments } from "../../../lib/api/payments.js";

const statusStyles = {
  paye: "bg-green-50 text-green-700",
  en_retard: "bg-red-50 text-red-600",
  a_venir: "bg-gray-100 text-gray-500",
};

export default function PaymentSchedulePage() {
  const { childId } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [schedule, setSchedule] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchChild(childId), fetchChildPayments(childId)])
      .then(([child, payments]) => {
        setSchedule({
          childName: `${child.prenom} ${child.nom}`,
          schedules: payments.map((p) => ({
            month: (p.date || "").slice(0, 7),
            dueDate: p.date,
            montant: p.montant || 0,
            statut: p.statut,
          })),
        });
      })
      .catch((err) => {
        setSchedule(null);
        setError(err.response?.data?.message || t("common.error"));
      })
      .finally(() => setLoading(false));
  }, [childId, t]);

  if (loading) {
    return <p className="text-gray-400 text-sm">{t("common.loading")}</p>;
  }

  if (!schedule) {
    return (
      <div className="text-center py-12">
        {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-2 mb-3 inline-block">{error}</p>}
        <p className="text-gray-500">{t("children.notFound")}</p>
        <button onClick={() => navigate("/creche/payments")} className="mt-3 text-teal-600 hover:underline text-sm">
          ← {t("common.cancel")}
        </button>
      </div>
    );
  }

  const totalPaid = schedule.schedules.filter((s) => s.statut === "paye").reduce((sum, s) => sum + s.montant, 0);
  const totalOverdue = schedule.schedules.filter((s) => s.statut === "en_retard").reduce((sum, s) => sum + s.montant, 0);
  const totalUpcoming = schedule.schedules.filter((s) => s.statut === "a_venir").reduce((sum, s) => sum + s.montant, 0);

  return (
    <div className="space-y-5 max-w-2xl">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate("/creche/payments")} className="text-gray-400 hover:text-gray-600">←</button>
        <div>
          <h1 className="text-xl font-bold text-gray-800">{t("payments.schedule")}</h1>
          <p className="text-sm text-gray-500">{schedule.childName}</p>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label={t("payments.totalPaid")} value={`${totalPaid.toLocaleString()} DZD`} color="text-green-600" />
        <StatCard label={t("children.overdue")} value={`${totalOverdue.toLocaleString()} DZD`} color="text-red-600" />
        <StatCard label={t("payments.upcoming")} value={`${totalUpcoming.toLocaleString()} DZD`} color="text-gray-600" />
      </div>

      {/* Desktop table */}
      <div className="hidden md:block bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
            <tr>
              <th className="text-start px-4 py-3">{t("payments.month")}</th>
              <th className="text-start px-4 py-3">{t("payments.dueDate")}</th>
              <th className="text-start px-4 py-3">{t("children.amount")}</th>
              <th className="text-start px-4 py-3">{t("children.status")}</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {schedule.schedules.map((s, i) => (
              <tr key={i} className="border-t border-gray-100">
                <td className="px-4 py-3 font-medium text-gray-800">{s.month}</td>
                <td className="px-4 py-3 text-gray-600">{s.dueDate}</td>
                <td className="px-4 py-3 text-gray-800">{s.montant.toLocaleString()} DZD</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusStyles[s.statut]}`}>
                    {t(`payments.status_${s.statut}`)}
                  </span>
                </td>
                <td className="px-4 py-3 text-end">
                  {s.statut === "en_retard" && (
                    <button
                      onClick={() => navigate("/creche/payments/nouveau")}
                      className="text-xs text-teal-600 hover:underline"
                    >
                      {t("payments.recordPayment")}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {schedule.schedules.map((s, i) => (
          <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-1">
              <span className="font-medium text-gray-800">{s.month}</span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusStyles[s.statut]}`}>
                {t(`payments.status_${s.statut}`)}
              </span>
            </div>
            <p className="text-sm text-gray-600">{s.montant.toLocaleString()} DZD</p>
            <p className="text-xs text-gray-400 mt-1">{t("payments.dueDate")}: {s.dueDate}</p>
            {s.statut === "en_retard" && (
              <button
                onClick={() => navigate("/creche/payments/nouveau")}
                className="mt-2 text-xs text-teal-600 hover:underline"
              >
                {t("payments.recordPayment")}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function StatCard({ label, value, color }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
      <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">{label}</p>
      <p className={`text-xl font-bold ${color}`}>{value}</p>
    </div>
  );
}
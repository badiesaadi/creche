import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { mockCrecheNetwork, mockGlobalHR, mockGlobalFinance } from "../../data/mockAdmin.js";

export default function AdminCrecheDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const creche = mockCrecheNetwork.find((c) => String(c.id) === id);
  const employees = mockGlobalHR.filter((e) => String(e.crecheId) === id);
  const finance = mockGlobalFinance.filter((f) => f.creche === creche?.nom);

  if (!creche) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">{t("admin.crecheNotFound")}</p>
        <button onClick={() => navigate("/admin/creches")} className="mt-3 text-teal-600 hover:underline text-sm">
          ← {t("common.cancel")}
        </button>
      </div>
    );
  }

  const netRevenue = creche.revenueMonth - creche.chargesMonth;

  return (
    <div className="space-y-5 max-w-4xl">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate("/admin/creches")} className="text-gray-400 hover:text-gray-600">←</button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-gray-800">{creche.nom}</h1>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${creche.statut === "active" ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"}`}>
              {creche.statut === "active" ? t("admin.active") : t("admin.inactive")}
            </span>
          </div>
          <p className="text-sm text-gray-500">{creche.adresse} · {creche.telephone}</p>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <KPICard label={t("admin.children")} value={creche.enfantsCount} color="text-teal-700" />
        <KPICard label={t("admin.employees")} value={creche.employesCount} color="text-blue-700" />
        <KPICard label={t("admin.fillRate")} value={`${creche.tauxRemplissage}%`} color={creche.tauxRemplissage > 80 ? "text-orange-600" : "text-teal-700"} />
        <KPICard label={t("admin.netRevenue")} value={`${netRevenue.toLocaleString()} DZD`} color="text-green-700" />
      </div>

      {/* Fill rate bar */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">{t("admin.fillRate")}</span>
          <span className="text-sm font-bold text-gray-800">{creche.tauxRemplissage}%</span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div className={`h-full rounded-full ${creche.tauxRemplissage > 90 ? "bg-red-500" : creche.tauxRemplissage > 75 ? "bg-yellow-400" : "bg-teal-500"}`}
            style={{ width: `${creche.tauxRemplissage}%` }} />
        </div>
      </div>

      {/* Finance summary */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 space-y-4">
        <h2 className="font-semibold text-gray-700">{t("admin.financeSummary")}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-xs text-gray-400 uppercase mb-1">{t("admin.collected")}</p>
            <p className="text-lg font-bold text-green-600">{creche.revenueMonth.toLocaleString()} DZD</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase mb-1">{t("admin.expenses")}</p>
            <p className="text-lg font-bold text-red-500">{creche.chargesMonth.toLocaleString()} DZD</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase mb-1">{t("admin.netRevenue")}</p>
            <p className={`text-lg font-bold ${netRevenue >= 0 ? "text-teal-700" : "text-red-600"}`}>{netRevenue.toLocaleString()} DZD</p>
          </div>
        </div>
      </div>

      {/* Staff list */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 space-y-3">
        <h2 className="font-semibold text-gray-700">{t("admin.staff")} ({employees.length})</h2>
        {employees.length === 0 ? (
          <p className="text-sm text-gray-400">{t("common.noResults")}</p>
        ) : (
          <div className="space-y-2">
            {employees.map((e) => (
              <div key={e.id} className="flex items-center justify-between px-3 py-2 rounded-md bg-gray-50">
                <div>
                  <p className="text-sm font-medium text-gray-800">{e.nom}</p>
                  <p className="text-xs text-gray-500">{e.poste}</p>
                </div>
                <p className="text-sm text-gray-700">{e.salaire.toLocaleString()} DZD</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Finance history */}
      {finance.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto">
          <div className="p-5 pb-2">
            <h2 className="font-semibold text-gray-700">{t("admin.financeHistory")}</h2>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
              <tr>
                <th className="text-start px-4 py-3">{t("admin.month")}</th>
                <th className="text-start px-4 py-3">{t("admin.collected")}</th>
                <th className="text-start px-4 py-3">{t("admin.expenses")}</th>
                <th className="text-start px-4 py-3">{t("admin.netRevenue")}</th>
              </tr>
            </thead>
            <tbody>
              {finance.map((f) => (
                <tr key={f.id} className="border-t border-gray-100">
                  <td className="px-4 py-3 font-medium text-gray-800">{f.mois}</td>
                  <td className="px-4 py-3 text-green-600">{f.collected.toLocaleString()} DZD</td>
                  <td className="px-4 py-3 text-red-500">{f.expenses.toLocaleString()} DZD</td>
                  <td className="px-4 py-3 font-semibold text-teal-700">{(f.collected - f.expenses).toLocaleString()} DZD</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function KPICard({ label, value, color }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
      <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">{label}</p>
      <p className={`text-xl font-bold ${color}`}>{value}</p>
    </div>
  );
}

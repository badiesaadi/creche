import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { mockNetworkKPIs, mockCrecheNetwork, mockGlobalFinance } from "../../data/mockAdmin.js";

export default function AdminDashboardPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const kpis = mockNetworkKPIs;
  const creches = mockCrecheNetwork;

  const months = [...new Set(mockGlobalFinance.map((f) => f.mois))];
  const chartData = months.map((mois) => {
    const rows = mockGlobalFinance.filter((f) => f.mois === mois);
    return {
      mois,
      collected: rows.reduce((s, r) => s + r.collected, 0),
      expenses: rows.reduce((s, r) => s + r.expenses, 0),
    };
  });
  const maxVal = Math.max(...chartData.map((d) => d.collected), 1);

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-gray-800">{t("admin.networkDashboard")}</h1>

      {/* KPI cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <KPICard label={t("admin.totalChildren")} value={kpis.totalEnfants} color="text-teal-700" />
        <KPICard label={t("admin.totalEmployees")} value={kpis.totalEmployes} color="text-blue-700" />
        <KPICard label={t("admin.activeCreches")} value={kpis.totalCrecheActives} color="text-purple-700" />
        <KPICard label={t("admin.monthRevenue")} value={`${kpis.revenueThisMonth.toLocaleString()} DZD`} color="text-green-700" />
        <KPICard label={t("admin.pendingPayments")} value={kpis.pendingPayments} color="text-yellow-600" />
        <KPICard label={t("admin.absencesToday")} value={kpis.absencesToday} color="text-red-500" />
      </div>

      {/* Revenue chart */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
        <h2 className="font-semibold text-gray-700 mb-4">{t("admin.revenueChart")}</h2>
        <div className="flex items-end gap-4 h-32">
          {chartData.map((d) => (
            <div key={d.mois} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full flex gap-1 items-end" style={{ height: "100px" }}>
                <div
                  className="flex-1 rounded-t-md bg-teal-500 transition-all"
                  style={{ height: `${(d.collected / maxVal) * 100}%`, minHeight: "4px" }}
                  title={`${t("admin.collected")}: ${d.collected.toLocaleString()} DZD`}
                />
                <div
                  className="flex-1 rounded-t-md bg-red-300 transition-all"
                  style={{ height: `${(d.expenses / maxVal) * 100}%`, minHeight: "4px" }}
                  title={`${t("admin.expenses")}: ${d.expenses.toLocaleString()} DZD`}
                />
              </div>
              <p className="text-xs text-gray-400 text-center leading-tight">{d.mois.replace(" 2025", "")}</p>
            </div>
          ))}
        </div>
        <div className="flex gap-4 mt-3">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-sm bg-teal-500" />
            <span className="text-xs text-gray-500">{t("admin.collected")}</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-sm bg-red-300" />
            <span className="text-xs text-gray-500">{t("admin.expenses")}</span>
          </div>
        </div>
      </div>

      {/* Fill rate per creche */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 space-y-4">
        <h2 className="font-semibold text-gray-700">{t("admin.fillRatePerCreche")}</h2>
        {creches.filter((c) => c.statut === "active").map((c) => (
          <div key={c.id}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-gray-700">{c.nom}</span>
              <span className="text-sm font-semibold text-gray-800">{c.tauxRemplissage}%</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${c.tauxRemplissage > 90 ? "bg-red-500" : c.tauxRemplissage > 75 ? "bg-yellow-400" : "bg-teal-500"}`}
                style={{ width: `${c.tauxRemplissage}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Creches overview */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-gray-700">{t("admin.crechesOverview")}</h2>
          <button onClick={() => navigate("/admin/creches")} className="text-xs text-teal-600 hover:underline">
            {t("admin.viewAll")}
          </button>
        </div>
        {creches.map((c) => (
          <div
            key={c.id}
            onClick={() => navigate(`/admin/creches/${c.id}`)}
            className="flex items-center justify-between px-3 py-3 rounded-md hover:bg-gray-50 cursor-pointer"
          >
            <div>
              <p className="text-sm font-medium text-gray-800">{c.nom}</p>
              <p className="text-xs text-gray-500">{c.manager} · {c.enfantsCount} {t("admin.children")}</p>
            </div>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${c.statut === "active" ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"}`}>
              {c.statut === "active" ? t("admin.active") : t("admin.inactive")}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function KPICard({ label, value, color }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
      <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">{label}</p>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
    </div>
  );
}

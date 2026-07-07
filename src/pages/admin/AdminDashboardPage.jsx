import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { fetchCreches } from "../../lib/api/creches.js";
import { fetchAdminDashboard, fetchAdminFinancial } from "../../lib/api/admin.js";

// The spec only documents /admin/dashboard and /admin/financial as a generic
// "SuccessResponse" with no field-level schema, so we read several likely key
// names defensively and fall back to "—" rather than guessing wrong and
// silently showing fabricated numbers.
function pick(obj, ...keys) {
  for (const k of keys) {
    if (obj?.[k] !== undefined && obj?.[k] !== null) return obj[k];
  }
  return null;
}

function extractDashboardExtras(data) {
  return {
    revenueThisMonth: pick(data, "revenueThisMonth", "monthlyRevenue", "revenue"),
    pendingPayments: pick(data, "pendingPayments", "latePayments", "overduePayments"),
    absencesToday: pick(data, "absencesToday", "todayAbsences", "absencesCount"),
  };
}

// Try to normalize a monthly revenue/expenses breakdown into a consistent
// shape for the chart. Returns [] if the response doesn't look like an array
// of monthly rows — we don't fabricate a chart from an unrecognized shape.
function extractMonthlyBreakdown(data) {
  const rows = Array.isArray(data) ? data : data?.byMonth || data?.months || data?.items;
  if (!Array.isArray(rows)) return [];
  return rows
    .map((r) => ({
      mois: pick(r, "month", "mois", "period"),
      collected: Number(pick(r, "collected", "revenue", "income") ?? 0),
      expenses: Number(pick(r, "expenses", "charges", "expense") ?? 0),
    }))
    .filter((r) => r.mois);
}

export default function AdminDashboardPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [creches, setCreches] = useState([]);
  const [extras, setExtras] = useState({ revenueThisMonth: null, pendingPayments: null, absencesToday: null });
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      fetchCreches(),
      fetchAdminDashboard().catch(() => ({})),
      fetchAdminFinancial().catch(() => null),
    ])
      .then(([crecheList, dashboardData, financialData]) => {
        setCreches(crecheList);
        setExtras(extractDashboardExtras(dashboardData || {}));
        setChartData(extractMonthlyBreakdown(financialData));
      })
      .catch((err) => setError(err.response?.data?.message || t("common.error")))
      .finally(() => setLoading(false));
  }, [t]);

  if (loading) {
    return <p className="text-gray-400 text-sm">{t("common.loading")}</p>;
  }

  const totalEnfants = creches.reduce((s, c) => s + (c.enfantsCount || 0), 0);
  const totalEmployes = creches.reduce((s, c) => s + (c.employesCount || 0), 0);
  const totalCrecheActives = creches.filter((c) => c.statut === "active").length;
  const maxVal = Math.max(...chartData.map((d) => d.collected), 1);
  const maxEnfants = Math.max(...creches.map((c) => c.enfantsCount || 0), 1);

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-gray-800">{t("admin.networkDashboard")}</h1>

      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-2">{error}</p>}

      {/* KPI cards — child/employee/creche counts are always real (from GET /creches);
          revenue/pending/absences show "—" if the backend response doesn't match a known shape. */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <KPICard label={t("admin.totalChildren")} value={totalEnfants} color="text-teal-700" />
        <KPICard label={t("admin.totalEmployees")} value={totalEmployes} color="text-blue-700" />
        <KPICard label={t("admin.activeCreches")} value={totalCrecheActives} color="text-purple-700" />
        <KPICard
          label={t("admin.monthRevenue")}
          value={extras.revenueThisMonth != null ? `${Number(extras.revenueThisMonth).toLocaleString()} DZD` : "—"}
          color="text-green-700"
        />
        <KPICard label={t("admin.pendingPayments")} value={extras.pendingPayments ?? "—"} color="text-yellow-600" />
        <KPICard label={t("admin.absencesToday")} value={extras.absencesToday ?? "—"} color="text-red-500" />
      </div>

      {/* Revenue chart — only rendered if /admin/financial returned a recognizable monthly breakdown */}
      {chartData.length > 0 && (
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
                <p className="text-xs text-gray-400 text-center leading-tight">{d.mois}</p>
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
      )}

      {/* Enrollment per creche — real enfantsCount from GET /creches. Not shown as a
          "fill rate" percentage since the backend has no capacity field to divide by. */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 space-y-4">
        <h2 className="font-semibold text-gray-700">{t("admin.enrollmentPerCreche")}</h2>
        {creches.filter((c) => c.statut === "active").map((c) => (
          <div key={c.id}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-gray-700">{c.nom}</span>
              <span className="text-sm font-semibold text-gray-800">{c.enfantsCount} {t("admin.children")}</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-teal-500"
                style={{ width: `${((c.enfantsCount || 0) / maxEnfants) * 100}%` }}
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

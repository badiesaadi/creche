import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { fetchCharges } from "../../lib/api/admin.js";
import { fetchCreches } from "../../lib/api/creches.js";
import { fetchAdminFinancial } from "../../lib/api/admin.js";

function pick(obj, ...keys) {
  for (const k of keys) {
    if (obj?.[k] !== undefined && obj?.[k] !== null) return obj[k];
  }
  return null;
}

// We try to normalize a per-creche/per-month revenue breakdown from whatever
// shape the backend returns; if it doesn't match, we show real expense data
// only rather than fabricate revenue numbers.
function extractRevenueRows(data, crecheNameById) {
  const rows = Array.isArray(data) ? data : data?.byMonth || data?.rows || data?.items;
  if (!Array.isArray(rows)) return [];
  return rows.map((r, i) => ({
    id: pick(r, "id") ?? i,
    creche: crecheNameById[pick(r, "crecheId", "creche_id")] || pick(r, "crecheName", "creche") || "—",
    mois: pick(r, "month", "mois", "period"),
    collected: Number(pick(r, "collected", "revenue", "income") ?? 0),
    pending: Number(pick(r, "pending", "outstanding", "late") ?? 0),
  })).filter((r) => r.mois);
}

export default function AdminFinancePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [crecheFilter, setCrecheFilter] = useState("toutes");
  const [moisFilter, setMoisFilter] = useState("tous");
  const [creches, setCreches] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [revenueRows, setRevenueRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchCreches()
      .then(async (crechesList) => {
        setCreches(crechesList);
        const nameById = Object.fromEntries(crechesList.map((c) => [c.id, c.nom]));
        const [charges, financial] = await Promise.all([
          fetchCharges({ crecheNameById: nameById }),
          fetchAdminFinancial().catch(() => null),
        ]);
        setExpenses(charges);
        setRevenueRows(extractRevenueRows(financial, nameById));
      })
      .catch((err) => setError(err.response?.data?.message || t("common.error")))
      .finally(() => setLoading(false));
  }, [t]);

  const months = [...new Set([...expenses.map((e) => e.date?.slice(0, 7)), ...revenueRows.map((r) => r.mois)].filter(Boolean))];

  const filteredExpenses = expenses.filter((e) => {
    const matchCreche = crecheFilter === "toutes" || e.creche === crecheFilter;
    const matchMois = moisFilter === "tous" || e.date?.slice(0, 7) === moisFilter;
    return matchCreche && matchMois;
  });
  const filteredRevenue = revenueRows.filter((f) => {
    const matchCreche = crecheFilter === "toutes" || f.creche === crecheFilter;
    const matchMois = moisFilter === "tous" || f.mois === moisFilter;
    return matchCreche && matchMois;
  });

  const totalCollected = filteredRevenue.reduce((s, f) => s + f.collected, 0);
  const totalPending = filteredRevenue.reduce((s, f) => s + f.pending, 0);
  const totalExpenses = filteredExpenses.reduce((s, e) => s + (e.montant || 0), 0);
  const netRevenue = totalCollected - totalExpenses;
  const hasRevenueData = revenueRows.length > 0;

  function handleExportCSV() {
    const headers = ["Crèche", "Catégorie", "Date", "Montant"];
    const rows = filteredExpenses.map((e) => [e.creche || "", e.categorie, e.date, e.montant]);
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "finance-reseau.csv"; a.click();
    URL.revokeObjectURL(url);
  }

  if (loading) {
    return <p className="text-gray-400 text-sm">{t("common.loading")}</p>;
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className="text-xl font-bold text-gray-800">{t("nav.finance")}</h1>
        <div className="flex gap-2">
          <button onClick={handleExportCSV}
            className="px-3 py-2 rounded-md border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50">
            CSV
          </button>
          <button onClick={() => navigate("/admin/expenses")}
            className="px-3 py-2 rounded-md bg-teal-600 text-white text-sm font-medium hover:bg-teal-700">
            {t("admin.expenses")}
          </button>
        </div>
      </div>

      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-2">{error}</p>}

      {!hasRevenueData && (
        <p className="text-xs text-yellow-700 bg-yellow-50 border border-yellow-200 rounded-md px-3 py-2">
          {t("admin.revenueDataUnavailable")}
        </p>
      )}

      {/* Summary cards — expenses are always real (GET /admin/charges); revenue only if the backend provided a breakdown */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label={t("admin.totalCollected")} value={hasRevenueData ? `${totalCollected.toLocaleString()} DZD` : "—"} color="text-green-600" />
        <StatCard label={t("admin.totalPending")} value={hasRevenueData ? `${totalPending.toLocaleString()} DZD` : "—"} color="text-yellow-600" />
        <StatCard label={t("admin.totalExpenses")} value={`${totalExpenses.toLocaleString()} DZD`} color="text-red-500" />
        <StatCard label={t("admin.netRevenue")} value={hasRevenueData ? `${netRevenue.toLocaleString()} DZD` : "—"} color={netRevenue >= 0 ? "text-teal-700" : "text-red-600"} />
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <select value={crecheFilter} onChange={(e) => setCrecheFilter(e.target.value)}
          className="w-full sm:w-48 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500">
          <option value="toutes">{t("admin.allCreches")}</option>
          {creches.map((c) => <option key={c.id} value={c.nom}>{c.nom}</option>)}
        </select>
        <select value={moisFilter} onChange={(e) => setMoisFilter(e.target.value)}
          className="w-full sm:w-48 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500">
          <option value="tous">{t("admin.allMonths")}</option>
          {months.map((m) => <option key={m} value={m}>{m}</option>)}
        </select>
      </div>

      {/* Revenue breakdown — only if backend provided one */}
      {hasRevenueData && (
        <div className="hidden md:block bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
              <tr>
                <th className="text-start px-4 py-3">{t("admin.creche")}</th>
                <th className="text-start px-4 py-3">{t("admin.month")}</th>
                <th className="text-start px-4 py-3">{t("admin.collected")}</th>
                <th className="text-start px-4 py-3">{t("admin.pending")}</th>
              </tr>
            </thead>
            <tbody>
              {filteredRevenue.map((f) => (
                <tr key={f.id} className="border-t border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800">{f.creche}</td>
                  <td className="px-4 py-3 text-gray-600">{f.mois}</td>
                  <td className="px-4 py-3 text-green-600">{f.collected.toLocaleString()} DZD</td>
                  <td className="px-4 py-3 text-yellow-600">{f.pending.toLocaleString()} DZD</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Expenses — always real, from GET /admin/charges */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto">
        <div className="px-4 py-3 border-b border-gray-100">
          <h2 className="font-semibold text-gray-700">{t("admin.expenses")}</h2>
        </div>
        <table className="w-full text-sm hidden md:table">
          <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
            <tr>
              <th className="text-start px-4 py-3">{t("admin.creche")}</th>
              <th className="text-start px-4 py-3">{t("admin.category")}</th>
              <th className="text-start px-4 py-3">{t("admin.date")}</th>
              <th className="text-start px-4 py-3">{t("admin.amount")}</th>
            </tr>
          </thead>
          <tbody>
            {filteredExpenses.map((e) => (
              <tr key={e.id} className="border-t border-gray-100 hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-800">{e.creche}</td>
                <td className="px-4 py-3 text-gray-600">{e.categorie}</td>
                <td className="px-4 py-3 text-gray-600">{e.date}</td>
                <td className="px-4 py-3 text-red-500">{(e.montant || 0).toLocaleString()} DZD</td>
              </tr>
            ))}
            {filteredExpenses.length === 0 && <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-400">{t("common.noResults")}</td></tr>}
          </tbody>
        </table>
        <div className="md:hidden divide-y divide-gray-100">
          {filteredExpenses.map((e) => (
            <div key={e.id} className="p-4 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-medium text-gray-800">{e.creche}</span>
                <span className="text-xs text-gray-400">{e.date}</span>
              </div>
              <p className="text-sm text-gray-600">{e.categorie}</p>
              <p className="text-sm font-semibold text-red-500">{(e.montant || 0).toLocaleString()} DZD</p>
            </div>
          ))}
          {filteredExpenses.length === 0 && <p className="text-center text-gray-400 py-8">{t("common.noResults")}</p>}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, color }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
      <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">{label}</p>
      <p className={`text-lg font-bold ${color}`}>{value}</p>
    </div>
  );
}

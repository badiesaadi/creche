import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { mockGlobalFinance, mockCrecheNetwork } from "../../data/mockAdmin.js";

export default function AdminFinancePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [crecheFilter, setCrecheFilter] = useState("toutes");
  const [moisFilter, setMoisFilter] = useState("tous");

  const creches = mockCrecheNetwork.map((c) => c.nom);
  const months = [...new Set(mockGlobalFinance.map((f) => f.mois))];

  const filtered = mockGlobalFinance.filter((f) => {
    const matchCreche = crecheFilter === "toutes" || f.creche === crecheFilter;
    const matchMois = moisFilter === "tous" || f.mois === moisFilter;
    return matchCreche && matchMois;
  });

  const totalCollected = filtered.reduce((s, f) => s + f.collected, 0);
  const totalPending = filtered.reduce((s, f) => s + f.pending, 0);
  const totalExpenses = filtered.reduce((s, f) => s + f.expenses, 0);
  const netRevenue = totalCollected - totalExpenses;

  function handlePrint() {
    window.print();
  }

  function handleExportCSV() {
    const headers = ["Crèche", "Mois", "Collecté", "En attente", "Charges", "Net"];
    const rows = filtered.map((f) => [f.creche, f.mois, f.collected, f.pending, f.expenses, f.collected - f.expenses]);
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "finance-reseau.csv"; a.click();
    URL.revokeObjectURL(url);
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
          <button onClick={handlePrint}
            className="px-3 py-2 rounded-md border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50">
            {t("admin.print")}
          </button>
          <button onClick={() => navigate("/admin/expenses")}
            className="px-3 py-2 rounded-md bg-teal-600 text-white text-sm font-medium hover:bg-teal-700">
            {t("admin.expenses")}
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label={t("admin.totalCollected")} value={`${totalCollected.toLocaleString()} DZD`} color="text-green-600" />
        <StatCard label={t("admin.totalPending")} value={`${totalPending.toLocaleString()} DZD`} color="text-yellow-600" />
        <StatCard label={t("admin.totalExpenses")} value={`${totalExpenses.toLocaleString()} DZD`} color="text-red-500" />
        <StatCard label={t("admin.netRevenue")} value={`${netRevenue.toLocaleString()} DZD`} color={netRevenue >= 0 ? "text-teal-700" : "text-red-600"} />
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <select value={crecheFilter} onChange={(e) => setCrecheFilter(e.target.value)}
          className="w-full sm:w-48 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500">
          <option value="toutes">{t("admin.allCreches")}</option>
          {creches.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={moisFilter} onChange={(e) => setMoisFilter(e.target.value)}
          className="w-full sm:w-48 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500">
          <option value="tous">{t("admin.allMonths")}</option>
          {months.map((m) => <option key={m} value={m}>{m}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="hidden md:block bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
            <tr>
              <th className="text-start px-4 py-3">{t("admin.creche")}</th>
              <th className="text-start px-4 py-3">{t("admin.month")}</th>
              <th className="text-start px-4 py-3">{t("admin.collected")}</th>
              <th className="text-start px-4 py-3">{t("admin.pending")}</th>
              <th className="text-start px-4 py-3">{t("admin.expenses")}</th>
              <th className="text-start px-4 py-3">{t("admin.netRevenue")}</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((f) => (
              <tr key={f.id} className="border-t border-gray-100 hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-800">{f.creche}</td>
                <td className="px-4 py-3 text-gray-600">{f.mois}</td>
                <td className="px-4 py-3 text-green-600">{f.collected.toLocaleString()} DZD</td>
                <td className="px-4 py-3 text-yellow-600">{f.pending.toLocaleString()} DZD</td>
                <td className="px-4 py-3 text-red-500">{f.expenses.toLocaleString()} DZD</td>
                <td className="px-4 py-3 font-semibold text-teal-700">{(f.collected - f.expenses).toLocaleString()} DZD</td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">{t("common.noResults")}</td></tr>}
          </tbody>
        </table>
      </div>

      {/* Mobile */}
      <div className="md:hidden space-y-3">
        {filtered.map((f) => (
          <div key={f.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-medium text-gray-800">{f.creche}</span>
              <span className="text-xs text-gray-400">{f.mois}</span>
            </div>
            <p className="text-sm text-green-600">↑ {f.collected.toLocaleString()} DZD</p>
            <p className="text-sm text-red-500">↓ {f.expenses.toLocaleString()} DZD</p>
            <p className="text-sm font-semibold text-teal-700">Net: {(f.collected - f.expenses).toLocaleString()} DZD</p>
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
      <p className={`text-lg font-bold ${color}`}>{value}</p>
    </div>
  );
}

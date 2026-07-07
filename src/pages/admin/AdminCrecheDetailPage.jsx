import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { fetchCreche } from "../../lib/api/creches.js";
import { fetchAdminEmployees, fetchAdminFinancial } from "../../lib/api/admin.js";

export default function AdminCrecheDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [creche, setCreche] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [finance, setFinance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    Promise.all([
      fetchCreche(id),
      fetchAdminEmployees({ crecheId: id }).catch(() => []),
      // Best-effort: backend financial history shape isn't documented in
      // detail (see admin.js note) — fall back to an empty list if it errors.
      fetchAdminFinancial({ crecheId: id }).catch(() => []),
    ])
      .then(([crecheData, employeesData, financeData]) => {
        setCreche(crecheData);
        setEmployees(employeesData);
        setFinance(Array.isArray(financeData) ? financeData : []);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return <p className="text-gray-400 text-sm py-8 text-center">{t("common.loading")}</p>;
  }

  if (notFound || !creche) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">{t("admin.crecheNotFound")}</p>
        <button onClick={() => navigate("/admin/creches")} className="mt-3 text-teal-600 hover:underline text-sm">
          ← {t("common.cancel")}
        </button>
      </div>
    );
  }

  const revenueMonth = creche.revenueMonth || 0;
  const chargesMonth = creche.chargesMonth || 0;
  const tauxRemplissage = creche.tauxRemplissage || 0;
  const netRevenue = revenueMonth - chargesMonth;

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
        <button onClick={() => navigate(`/admin/creches/${id}/modifier`)}
          className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50 whitespace-nowrap">
          {t("admin.editCreche")}
        </button>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <KPICard label={t("admin.children")} value={creche.enfantsCount ?? employees.length} color="text-teal-700" />
        <KPICard label={t("admin.employees")} value={creche.employesCount ?? employees.length} color="text-blue-700" />
        <KPICard label={t("admin.fillRate")} value={`${tauxRemplissage}%`} color={tauxRemplissage > 80 ? "text-orange-600" : "text-teal-700"} />
        <KPICard label={t("admin.netRevenue")} value={`${netRevenue.toLocaleString()} DZD`} color="text-green-700" />
      </div>

      {/* Fill rate bar */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">{t("admin.fillRate")}</span>
          <span className="text-sm font-bold text-gray-800">{tauxRemplissage}%</span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div className={`h-full rounded-full ${tauxRemplissage > 90 ? "bg-red-500" : tauxRemplissage > 75 ? "bg-yellow-400" : "bg-teal-500"}`}
            style={{ width: `${tauxRemplissage}%` }} />
        </div>
      </div>

      {/* Finance summary */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 space-y-4">
        <h2 className="font-semibold text-gray-700">{t("admin.financeSummary")}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-xs text-gray-400 uppercase mb-1">{t("admin.collected")}</p>
            <p className="text-lg font-bold text-green-600">{revenueMonth.toLocaleString()} DZD</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase mb-1">{t("admin.expenses")}</p>
            <p className="text-lg font-bold text-red-500">{chargesMonth.toLocaleString()} DZD</p>
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
                <p className="text-sm text-gray-700">{(e.salaire || 0).toLocaleString()} DZD</p>
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
              {finance.map((f, idx) => (
                <tr key={f.id ?? idx} className="border-t border-gray-100">
                  <td className="px-4 py-3 font-medium text-gray-800">{f.mois || f.month}</td>
                  <td className="px-4 py-3 text-green-600">{(f.collected || 0).toLocaleString()} DZD</td>
                  <td className="px-4 py-3 text-red-500">{(f.expenses || 0).toLocaleString()} DZD</td>
                  <td className="px-4 py-3 font-semibold text-teal-700">{((f.collected || 0) - (f.expenses || 0)).toLocaleString()} DZD</td>
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

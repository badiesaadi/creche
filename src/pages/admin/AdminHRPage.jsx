import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { fetchAdminEmployees } from "../../lib/api/admin.js";
import { fetchCreches } from "../../lib/api/creches.js";
import { addBonus } from "../../lib/api/employees.js";

const statusStyles = {
  actif: "bg-green-50 text-green-700",
  conge: "bg-yellow-50 text-yellow-700",
  inactif: "bg-gray-100 text-gray-500",
};

// NOTE: payslip generation (POST /employees/{id}/payslips), contract creation
// (POST /employees/{id}/contracts), and work-certificate/contract PDF generation
// (POST /documents/*) are all restricted to the crèche manager role on the
// backend — the Admin role gets a 403 on every one of them. Those actions were
// removed from this page for that reason; they belong on the manager's HR page
// instead. POST /admin/bonus is the one action actually scoped to Admin, so
// it's kept here.
export default function AdminHRPage() {
  const { t } = useTranslation();
  const [employees, setEmployees] = useState([]);
  const [creches, setCreches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [crecheFilter, setCrecheFilter] = useState("toutes");
  const [bonusForm, setBonusForm] = useState({ employeeId: null, montant: "", motif: "" });
  const [showBonusModal, setShowBonusModal] = useState(false);
  const [bonusError, setBonusError] = useState("");

  useEffect(() => {
    Promise.all([fetchAdminEmployees(), fetchCreches()])
      .then(([emps, crechesList]) => {
        setEmployees(emps);
        setCreches(crechesList);
      })
      .catch((err) => setError(err.response?.data?.message || t("common.error")))
      .finally(() => setLoading(false));
  }, [t]);

  const crecheNames = creches.map((c) => c.nom);
  const filtered = employees.filter((e) => {
    const matchSearch = e.nom.toLowerCase().includes(search.toLowerCase());
    const matchCreche = crecheFilter === "toutes" || e.creche === crecheFilter;
    return matchSearch && matchCreche;
  });
  const totalSalaries = filtered.reduce((sum, e) => sum + (e.salaire || 0), 0);

  function handleOpenBonus(id) {
    setBonusForm({ employeeId: id, montant: "", motif: "" });
    setBonusError("");
    setShowBonusModal(true);
  }

  async function handleSubmitBonus(ev) {
    ev.preventDefault();
    if (!bonusForm.montant || !bonusForm.motif.trim()) return;
    setBonusError("");
    try {
      await addBonus(bonusForm.employeeId, bonusForm.montant, bonusForm.motif);
      setShowBonusModal(false);
    } catch (err) {
      if (err.response?.status === 404) {
        setBonusError(t("admin.bonusNoPayslipError"));
      } else {
        setBonusError(err.response?.data?.message || t("common.error"));
      }
    }
  }

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold text-gray-800">{t("admin.globalHR")}</h1>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 inline-block">
        <p className="text-xs text-gray-400 uppercase">{t("admin.totalSalaries")}</p>
        <p className="text-2xl font-bold text-teal-700">{totalSalaries.toLocaleString()} DZD</p>
      </div>

      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-2">{error}</p>}
      {loading && <p className="text-gray-400 text-sm">{t("common.loading")}</p>}

      <div className="flex flex-col sm:flex-row gap-3">
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder={t("common.search")}
          className="w-full sm:w-56 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
        <select value={crecheFilter} onChange={(e) => setCrecheFilter(e.target.value)}
          className="w-full sm:w-48 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500">
          <option value="toutes">{t("admin.allCreches")}</option>
          {crecheNames.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* Desktop table */}
      <div className="hidden md:block bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
            <tr>
              <th className="text-start px-4 py-3">{t("hr.name")}</th>
              <th className="text-start px-4 py-3">{t("admin.creche")}</th>
              <th className="text-start px-4 py-3">{t("hr.position")}</th>
              <th className="text-start px-4 py-3">{t("hr.baseSalary")}</th>
              <th className="text-start px-4 py-3">{t("children.status")}</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((e) => (
              <tr key={e.id} className="border-t border-gray-100 hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-800">{e.nom}</td>
                <td className="px-4 py-3 text-gray-600">{e.creche}</td>
                <td className="px-4 py-3 text-gray-600">{e.poste || "—"}</td>
                <td className="px-4 py-3 text-gray-800">{(e.salaire || 0).toLocaleString()} DZD</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusStyles[e.statut]}`}>
                    {t(`hr.status${e.statut.charAt(0).toUpperCase() + e.statut.slice(1)}`)}
                  </span>
                </td>
                <td className="px-4 py-3 text-end">
                  <button onClick={() => handleOpenBonus(e.id)} className="text-xs text-teal-600 hover:underline">{t("admin.addBonus")}</button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">{t("common.noResults")}</td></tr>}
          </tbody>
        </table>
      </div>

      {/* Mobile */}
      <div className="md:hidden space-y-3">
        {filtered.map((e) => (
          <div key={e.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-medium text-gray-800">{e.nom}</span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusStyles[e.statut]}`}>
                {t(`hr.status${e.statut.charAt(0).toUpperCase() + e.statut.slice(1)}`)}
              </span>
            </div>
            <p className="text-sm text-gray-500">{e.poste || "—"} · {e.creche}</p>
            <p className="text-xs text-gray-400">{(e.salaire || 0).toLocaleString()} DZD</p>
            <div className="flex items-center gap-3 pt-1">
              <button onClick={() => handleOpenBonus(e.id)} className="text-xs text-teal-600 hover:underline">{t("admin.addBonus")}</button>
            </div>
          </div>
        ))}
        {filtered.length === 0 && <p className="text-center text-gray-400 py-8">{t("common.noResults")}</p>}
      </div>

      {/* Bonus modal */}
      {showBonusModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <form onSubmit={handleSubmitBonus} className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm space-y-4">
            <h2 className="font-semibold text-gray-800">{t("admin.addBonus")}</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t("children.amount")} (DZD)</label>
              <input type="number" value={bonusForm.montant} onChange={(e) => setBonusForm((p) => ({ ...p, montant: e.target.value }))} required
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t("admin.bonusReason")}</label>
              <input type="text" value={bonusForm.motif} onChange={(e) => setBonusForm((p) => ({ ...p, motif: e.target.value }))} required
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
            </div>
            {bonusError && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-2">{bonusError}</p>}
            <div className="flex gap-3 justify-end">
              <button type="button" onClick={() => setShowBonusModal(false)}
                className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 text-sm hover:bg-gray-50">{t("common.cancel")}</button>
              <button type="submit"
                className="px-4 py-2 rounded-md bg-teal-600 text-white text-sm font-medium hover:bg-teal-700">{t("common.save")}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

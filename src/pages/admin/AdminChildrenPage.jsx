import { useState } from "react";
import { useTranslation } from "react-i18next";
import { mockNetworkChildren, mockCrecheNetwork } from "../../data/mockAdmin.js";

export default function AdminChildrenPage() {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [crecheFilter, setCrecheFilter] = useState("toutes");
  const [insuranceFilter, setInsuranceFilter] = useState("tous");
  const [selected, setSelected] = useState([]);

  const creches = mockCrecheNetwork.map((c) => c.nom);

  const filtered = mockNetworkChildren.filter((child) => {
    const name = `${child.prenom} ${child.nom}`.toLowerCase();
    const matchSearch = name.includes(search.toLowerCase());
    const matchCreche = crecheFilter === "toutes" || child.creche === crecheFilter;
    const matchInsurance =
      insuranceFilter === "tous" ||
      (insuranceFilter === "assure" && child.assure) ||
      (insuranceFilter === "non_assure" && !child.assure);
    return matchSearch && matchCreche && matchInsurance;
  });

  const uninsuredCount = mockNetworkChildren.filter((c) => !c.assure).length;

  function toggleSelect(id) {
    setSelected((prev) => prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]);
  }
  function toggleAll() {
    setSelected(selected.length === filtered.length ? [] : filtered.map((c) => c.id));
  }
  function handleBulkCertificate() {
    // TODO: real API -> apiClient.post("/admin/children/certificates/bulk", { ids: selected })
    alert(t("admin.bulkCertificateMsg", { count: selected.length }));
    setSelected([]);
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-800">{t("admin.childrenNetwork")}</h1>
          {uninsuredCount > 0 && (
            <p className="text-xs text-red-500 mt-0.5">{t("admin.uninsuredAlert", { count: uninsuredCount })}</p>
          )}
        </div>
        {selected.length > 0 && (
          <button onClick={handleBulkCertificate}
            className="w-full sm:w-auto px-4 py-2 rounded-md bg-teal-600 text-white text-sm font-medium hover:bg-teal-700">
            {t("admin.bulkCertificate")} ({selected.length})
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder={t("common.search")}
          className="w-full sm:w-56 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
        <select value={crecheFilter} onChange={(e) => setCrecheFilter(e.target.value)}
          className="w-full sm:w-48 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500">
          <option value="toutes">{t("admin.allCreches")}</option>
          {creches.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={insuranceFilter} onChange={(e) => setInsuranceFilter(e.target.value)}
          className="w-full sm:w-48 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500">
          <option value="tous">{t("admin.allInsurance")}</option>
          <option value="assure">{t("admin.insured")}</option>
          <option value="non_assure">{t("admin.notInsured")}</option>
        </select>
      </div>

      {/* Desktop table */}
      <div className="hidden md:block bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
            <tr>
              <th className="px-4 py-3">
                <input type="checkbox" checked={selected.length === filtered.length && filtered.length > 0}
                  onChange={toggleAll} className="w-4 h-4 text-teal-600 rounded focus:ring-teal-500" />
              </th>
              <th className="text-start px-4 py-3">{t("children.fullName")}</th>
              <th className="text-start px-4 py-3">{t("admin.creche")}</th>
              <th className="text-start px-4 py-3">{t("children.enrollmentDate")}</th>
              <th className="text-start px-4 py-3">{t("admin.insurance")}</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((child) => (
              <tr key={child.id} className="border-t border-gray-100 hover:bg-gray-50">
                <td className="px-4 py-3">
                  <input type="checkbox" checked={selected.includes(child.id)} onChange={() => toggleSelect(child.id)}
                    className="w-4 h-4 text-teal-600 rounded focus:ring-teal-500" />
                </td>
                <td className="px-4 py-3 font-medium text-gray-800">{child.prenom} {child.nom}</td>
                <td className="px-4 py-3 text-gray-600">{child.creche}</td>
                <td className="px-4 py-3 text-gray-600">{child.dateInscription}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${child.assure ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"}`}>
                    {child.assure ? t("admin.insured") : t("admin.notInsured")}
                  </span>
                </td>
                <td className="px-4 py-3 text-end">
                  <button onClick={() => alert(`${t("docs.enrollmentCertificate")} — ${child.prenom} ${child.nom}`)}
                    className="text-xs text-teal-600 hover:underline">{t("docs.certificate")}</button>
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
        {filtered.map((child) => (
          <div key={child.id} className={`bg-white rounded-xl shadow-sm border p-4 ${selected.includes(child.id) ? "border-teal-400" : "border-gray-200"}`}
            onClick={() => toggleSelect(child.id)}>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <input type="checkbox" checked={selected.includes(child.id)} onChange={() => toggleSelect(child.id)}
                  className="w-4 h-4 text-teal-600 rounded focus:ring-teal-500" onClick={(e) => e.stopPropagation()} />
                <span className="font-medium text-gray-800">{child.prenom} {child.nom}</span>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${child.assure ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"}`}>
                {child.assure ? t("admin.insured") : t("admin.notInsured")}
              </span>
            </div>
            <p className="text-xs text-gray-500 ms-6">{child.creche} · {child.dateInscription}</p>
          </div>
        ))}
        {filtered.length === 0 && <p className="text-center text-gray-400 py-8">{t("common.noResults")}</p>}
      </div>
    </div>
  );
}

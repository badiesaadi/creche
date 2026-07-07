import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { fetchAdminChildren } from "../../lib/api/admin.js";
import { fetchCreches } from "../../lib/api/creches.js";
import { generateEnrollmentCertificate } from "../../lib/api/documents.js";

export default function AdminChildrenPage() {
  const { t } = useTranslation();
  const [children, setChildren] = useState([]);
  const [creches, setCreches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [crecheFilter, setCrecheFilter] = useState("toutes");
  const [insuranceFilter, setInsuranceFilter] = useState("tous");
  const [selected, setSelected] = useState([]);

  useEffect(() => {
    Promise.all([fetchAdminChildren(), fetchCreches()])
      .then(([childrenList, crechesList]) => {
        setChildren(childrenList);
        setCreches(crechesList);
      })
      .catch((err) => setError(err.response?.data?.message || t("common.error")))
      .finally(() => setLoading(false));
  }, [t]);

  const crecheNames = creches.map((c) => c.nom);

  const filtered = children.filter((child) => {
    const name = `${child.prenom} ${child.nom}`.toLowerCase();
    const matchSearch = name.includes(search.toLowerCase());
    const matchCreche = crecheFilter === "toutes" || child.creche === crecheFilter;
    const matchInsurance =
      insuranceFilter === "tous" ||
      (insuranceFilter === "assure" && child.assure) ||
      (insuranceFilter === "non_assure" && !child.assure);
    return matchSearch && matchCreche && matchInsurance;
  });

  const uninsuredCount = children.filter((c) => !c.assure).length;

  function toggleSelect(id) {
    setSelected((prev) => prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]);
  }
  function toggleAll() {
    setSelected(selected.length === filtered.length ? [] : filtered.map((c) => c.id));
  }

  async function handleCertificate(child) {
    try {
      const url = await generateEnrollmentCertificate(child.id);
      if (url) {
        window.open(url, "_blank");
        return;
      }
    } catch {
      // fall through to the client-rendered printable version below
    }
    printCertificates([child]);
  }

  async function handleBulkCertificate() {
    const children_ = children.filter((c) => selected.includes(c.id));
    // No bulk-certificate endpoint on the backend — generate one at a time.
    const urls = await Promise.all(
      children_.map((c) => generateEnrollmentCertificate(c.id).catch(() => null))
    );
    const missing = children_.filter((_, i) => !urls[i]);
    urls.forEach((url) => url && window.open(url, "_blank"));
    if (missing.length) printCertificates(missing);
    setSelected([]);
  }

  function printCertificates(children) {
    const today = new Date().toLocaleDateString("fr-DZ");
    const blocks = children.map((child) => `
      <div class="cert">
        <h1>${child.creche}</h1>
        <h2>${t("docs.enrollmentCertificate")}</h2>
        <p>${t("docs.enrollmentBody1", {
          name: `${child.prenom} ${child.nom}`,
          dob: child.dateNaissance || "—",
          creche: child.creche,
          date: child.dateInscription,
        })}</p>
        <p>${t("docs.enrollmentBody2")}</p>
        <div class="row"><span>${t("children.fullName")}</span><span>${child.prenom} ${child.nom}</span></div>
        <div class="row"><span>${t("children.enrollmentDate")}</span><span>${child.dateInscription}</span></div>
        <div class="sig"><span>${t("docs.issuedOn", { date: today })}</span><div>${t("docs.managerSignature")}<div class="line"></div></div></div>
      </div>`).join("");

    const win = window.open("", "_blank");
    win.document.write(`<!DOCTYPE html><html><head><title>${t("docs.bulkCertificateTitle")}</title>
      <style>body{font-family:sans-serif;padding:24px}
      .cert{max-width:700px;margin:0 auto 40px;padding-bottom:30px;border-bottom:1px dashed #d1d5db}
      .cert:last-child{border-bottom:none}
      h1{text-align:center;font-size:16px;color:#6b7280;text-transform:uppercase}
      h2{text-align:center;font-size:18px}
      p{line-height:1.6;color:#374151}
      .row{display:flex;gap:8px;margin:4px 0} .row span:first-child{font-weight:600;width:180px}
      .sig{display:flex;justify-content:space-between;align-items:flex-end;margin-top:24px;font-size:12px;color:#9ca3af}
      .sig .line{border-top:1px solid #9ca3af;width:140px;margin-top:30px}</style></head>
      <body>${blocks}</body></html>`);
    win.document.close();
    win.print();
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

      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-2">{error}</p>}
      {loading && <p className="text-gray-400 text-sm">{t("common.loading")}</p>}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder={t("common.search")}
          className="w-full sm:w-56 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
        <select value={crecheFilter} onChange={(e) => setCrecheFilter(e.target.value)}
          className="w-full sm:w-48 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500">
          <option value="toutes">{t("admin.allCreches")}</option>
          {crecheNames.map((c) => <option key={c} value={c}>{c}</option>)}
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
                  <button onClick={() => handleCertificate(child)}
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

import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { fetchAdminEmployees } from "../../lib/api/admin.js";
import { fetchCreches } from "../../lib/api/creches.js";
import { addBonus, addContract, addPayslip } from "../../lib/api/employees.js";
import { generateWorkCertificate } from "../../lib/api/documents.js";

const statusStyles = {
  actif: "bg-green-50 text-green-700",
  conge: "bg-yellow-50 text-yellow-700",
  inactif: "bg-gray-100 text-gray-500",
};

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
  const [contractForm, setContractForm] = useState({ employeeId: null, poste: "", type: "CDI", dateDebut: "", dateFin: "", salaire: "" });
  const [showContractModal, setShowContractModal] = useState(false);

  useEffect(() => {
    Promise.all([fetchAdminEmployees(), fetchCreches()])
      .then(([emps, crechesList]) => {
        // Backend has no per-employee "payslip status" field on the list
        // endpoint, so we default to pending until validated this session.
        setEmployees(emps.map((e) => ({ ...e, payslipStatut: e.payslipStatut || "en_attente" })));
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

  async function handleValidatePayslip(id) {
    // No dedicated "validate payslip" endpoint exists on the backend — the
    // closest available action is issuing this month's payslip record.
    try {
      await addPayslip(id, new Date().toISOString().slice(0, 7));
      setEmployees((prev) => prev.map((e) => e.id === id ? { ...e, payslipStatut: "valide" } : e));
    } catch (err) {
      setError(err.response?.data?.message || t("common.error"));
    }
  }

  function handleOpenBonus(id) {
    setBonusForm({ employeeId: id, montant: "", motif: "" });
    setShowBonusModal(true);
  }

  async function handleSubmitBonus(ev) {
    ev.preventDefault();
    if (!bonusForm.montant || !bonusForm.motif.trim()) return;
    try {
      await addBonus(bonusForm.employeeId, bonusForm.montant, bonusForm.motif);
      setShowBonusModal(false);
    } catch (err) {
      setError(err.response?.data?.message || t("common.error"));
    }
  }

  async function handleWorkCertificate(emp) {
    try {
      const url = await generateWorkCertificate(emp.id);
      if (url) {
        window.open(url, "_blank");
        return;
      }
    } catch {
      // fall through to the client-rendered printable version below
    }
    const today = new Date().toLocaleDateString("fr-DZ");
    const body = t("docs.workCertificateBody", { name: emp.nom, poste: emp.poste, creche: emp.creche });
    const win = window.open("", "_blank");
    win.document.write(`<!DOCTYPE html><html><head><title>${t("admin.workCertificate")}</title>
      <style>body{font-family:sans-serif;padding:40px;max-width:700px;margin:auto}
      h1{text-align:center;font-size:20px;text-transform:uppercase}
      p{line-height:1.7;color:#374151}
      .sig{display:flex;justify-content:flex-end;margin-top:60px}
      .sig div{text-align:center}
      .sig .line{border-top:1px solid #9ca3af;width:160px;margin-top:40px}
      .date{color:#9ca3af;font-size:12px;text-align:center;margin-top:24px}</style></head>
      <body>
        <h1>${t("admin.workCertificate")}</h1>
        <p>${body}</p>
        <div class="sig"><div>${t("docs.managerSignature")}<div class="line"></div></div></div>
        <p class="date">${t("docs.issuedOn", { date: today })}</p>
      </body></html>`);
    win.document.close();
    win.print();
  }

  function handleOpenContract(emp) {
    setContractForm({ employeeId: emp.id, poste: emp.poste || "", type: "CDI", dateDebut: new Date().toISOString().slice(0, 10), dateFin: "", salaire: emp.salaire || "" });
    setShowContractModal(true);
  }

  async function handleGenerateContract(ev) {
    ev.preventDefault();
    if (!contractForm.poste?.trim() || !contractForm.dateDebut || !contractForm.salaire) return;
    const emp = employees.find((e) => e.id === contractForm.employeeId);
    const empCreche = creches.find((c) => c.id === emp?.crecheId);

    try {
      await addContract(contractForm.employeeId, contractForm);
    } catch (err) {
      setError(err.response?.data?.message || t("common.error"));
      return;
    }

    const today = new Date().toLocaleDateString("fr-DZ");
    const win = window.open("", "_blank");
    win.document.write(`<!DOCTYPE html><html><head><title>${t("docs.workContract")}</title>
      <style>body{font-family:sans-serif;padding:40px;max-width:700px;margin:auto}
      h1,h2{text-align:center} h1{font-size:20px} h2{font-size:16px;text-transform:uppercase}
      .row{display:flex;gap:8px;margin:4px 0} .row span:first-child{font-weight:600;width:160px}
      .box{border:1px solid #e5e7eb;border-radius:6px;padding:16px;margin:20px 0}
      .sig{display:flex;justify-content:space-between;margin-top:60px}
      .sig div{text-align:center} .sig .line{border-top:1px solid #9ca3af;width:160px;margin-top:40px}
      .date{color:#9ca3af;font-size:12px;text-align:center;margin-top:24px}</style></head>
      <body>
        <h1>${empCreche?.nom || emp?.creche || ""}</h1>
        <h2>${t("docs.workContract")} — ${contractForm.type}</h2>
        <p><b>${t("docs.between")}:</b></p>
        <p><b>${t("docs.employer")}:</b> ${empCreche?.nom || emp?.creche || ""}${empCreche?.adresse ? `, ${empCreche.adresse}` : ""}</p>
        <p><b>${t("docs.employee")}:</b> ${emp?.nom || ""}</p>
        <div class="box">
          <div class="row"><span>${t("hr.contractType")}</span><span>${contractForm.type}</span></div>
          <div class="row"><span>${t("hr.position")}</span><span>${contractForm.poste}</span></div>
          <div class="row"><span>${t("hr.startDate")}</span><span>${contractForm.dateDebut}</span></div>
          <div class="row"><span>${t("hr.endDate")}</span><span>${contractForm.dateFin || t("hr.indefinite")}</span></div>
          <div class="row"><span>${t("hr.salary")}</span><span>${Number(contractForm.salaire).toLocaleString()} DZD ${t("docs.perMonth")}</span></div>
        </div>
        <p>${t("docs.clauses")}:</p>
        <p>1. ${t("docs.clause1")}</p>
        <p>2. ${t("docs.clause2")}</p>
        <p>3. ${t("docs.clause3")}</p>
        <div class="sig">
          <div>${t("docs.employerSignature")}<div class="line"></div></div>
          <div>${t("docs.employeeSignature")}<div class="line"></div></div>
        </div>
        <p class="date">${t("docs.issuedOn", { date: today })}</p>
      </body></html>`);
    win.document.close();
    win.print();

    setShowContractModal(false);
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
              <th className="text-start px-4 py-3">{t("admin.payslip")}</th>
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
                <td className="px-4 py-3">
                  {e.payslipStatut === "valide" ? (
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700">{t("hr.validated")}</span>
                  ) : (
                    <button onClick={() => handleValidatePayslip(e.id)}
                      className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-50 text-yellow-700 hover:bg-yellow-100 border border-yellow-200">
                      {t("admin.validate")}
                    </button>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3 justify-end">
                    <button onClick={() => handleOpenBonus(e.id)} className="text-xs text-teal-600 hover:underline">{t("admin.addBonus")}</button>
                    <button onClick={() => handleOpenContract(e)} className="text-xs text-gray-500 hover:underline">{t("admin.addContract")}</button>
                    <button onClick={() => handleWorkCertificate(e)} className="text-xs text-gray-500 hover:underline">{t("admin.workCertificate")}</button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">{t("common.noResults")}</td></tr>}
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
            <p className="text-sm text-gray-500">{e.poste} · {e.creche}</p>
            <p className="text-xs text-gray-400">{(e.salaire || 0).toLocaleString()} DZD</p>
            <div className="flex items-center gap-3 pt-1">
              {e.payslipStatut !== "valide" && (
                <button onClick={() => handleValidatePayslip(e.id)} className="text-xs text-yellow-600 hover:underline">{t("admin.validate")}</button>
              )}
              <button onClick={() => handleOpenBonus(e.id)} className="text-xs text-teal-600 hover:underline">{t("admin.addBonus")}</button>
              <button onClick={() => handleOpenContract(e)} className="text-xs text-gray-500 hover:underline">{t("admin.addContract")}</button>
              <button onClick={() => handleWorkCertificate(e)} className="text-xs text-gray-500 hover:underline">{t("admin.workCertificate")}</button>
            </div>
          </div>
        ))}
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
            <div className="flex gap-3 justify-end">
              <button type="button" onClick={() => setShowBonusModal(false)}
                className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 text-sm hover:bg-gray-50">{t("common.cancel")}</button>
              <button type="submit"
                className="px-4 py-2 rounded-md bg-teal-600 text-white text-sm font-medium hover:bg-teal-700">{t("common.save")}</button>
            </div>
          </form>
        </div>
      )}

      {/* Contract modal — REQ-021: admin-editable contract template */}
      {showContractModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <form onSubmit={handleGenerateContract} className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md space-y-4">
            <h2 className="font-semibold text-gray-800">{t("admin.addContract")}</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t("admin.contractPosition")}</label>
              <input type="text" value={contractForm.poste} onChange={(e) => setContractForm((p) => ({ ...p, poste: e.target.value }))} required
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t("hr.contractType")}</label>
                <select value={contractForm.type} onChange={(e) => setContractForm((p) => ({ ...p, type: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500">
                  <option value="CDI">CDI</option>
                  <option value="CDD">CDD</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t("hr.salary")} (DZD)</label>
                <input type="number" value={contractForm.salaire} onChange={(e) => setContractForm((p) => ({ ...p, salaire: e.target.value }))} required
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t("hr.startDate")}</label>
                <input type="date" value={contractForm.dateDebut} onChange={(e) => setContractForm((p) => ({ ...p, dateDebut: e.target.value }))} required
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t("hr.endDate")}</label>
                <input type="date" value={contractForm.dateFin} onChange={(e) => setContractForm((p) => ({ ...p, dateFin: e.target.value }))}
                  disabled={contractForm.type === "CDI"}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:bg-gray-50" />
              </div>
            </div>
            <div className="flex gap-3 justify-end">
              <button type="button" onClick={() => setShowContractModal(false)}
                className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 text-sm hover:bg-gray-50">{t("common.cancel")}</button>
              <button type="submit"
                className="px-4 py-2 rounded-md bg-teal-600 text-white text-sm font-medium hover:bg-teal-700">{t("admin.generateContract")}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

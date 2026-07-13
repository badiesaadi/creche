import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { fetchEmployee, fetchEmployeeFull, restoreEmployee, deleteEmployee, addEmployeeAbsence, addPayslip, addContract } from "../../../lib/api/employees.js";
import { generateWorkCertificate } from "../../../lib/api/documents.js";
import { useAuth } from "../../../lib/auth/AuthContext.jsx";

const tabs = ["profile", "contract", "absences", "payslips"];

// The full employee record doesn't return a fixed set of fields, so we
// check a few possible key names for each section.
function extrasFromApi(data) {
  const absences = (data.absences || []).map((a) => ({
    id: a.id,
    date: a.date,
    motif: a.reason || a.motif || "",
    justifie: a.justified ?? a.justifie ?? false,
  }));
  const payslips = (data.payslips || []).map((p) => ({
    id: p.id,
    mois: p.period || p.mois,
    net: p.netAmount ?? p.net ?? 0,
    statut: p.validated || p.statut === "valide" ? "valide" : "en_attente",
  }));
  const contracts = (data.contracts || [])
    .map((c) => ({
      id: c.id,
      type: c.type,
      poste: c.position || c.poste,
      salaire: c.baseSalary ?? c.salaire ?? 0,
      dateDebut: c.startDate || c.dateDebut,
      dateFin: c.endDate || c.dateFin || null,
    }))
    // Most recent contract first (by start date), so the newest one added shows as "current".
    .sort((a, b) => (b.dateDebut || "").localeCompare(a.dateDebut || ""));
  return { absences, payslips, contracts };
}

export default function EmployeeDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useAuth();
  const isManager = user?.role === "manager";
  const [activeTab, setActiveTab] = useState("profile");

  const [employee, setEmployee] = useState(null);
  const [extras, setExtras] = useState({ absences: [], payslips: [], contracts: [] });
  const [loading, setLoading] = useState(true);
  const [actionError, setActionError] = useState("");
  const [busy, setBusy] = useState(false);

  function load() {
    setLoading(true);
    return Promise.all([fetchEmployee(id), fetchEmployeeFull(id).catch(() => ({}))])
      .then(([empData, fullData]) => {
        setEmployee(empData);
        setExtras(extrasFromApi(fullData || {}));
      })
      .catch(() => setEmployee(null))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function handleDeactivate() {
    if (!window.confirm(t("hr.confirmDeactivate"))) return;
    setBusy(true);
    setActionError("");
    try {
      await deleteEmployee(id);
      await load();
    } catch (err) {
      setActionError(err.response?.data?.message || t("common.error"));
    } finally {
      setBusy(false);
    }
  }

  async function handleRestore() {
    setBusy(true);
    setActionError("");
    try {
      await restoreEmployee(id);
      await load();
    } catch (err) {
      setActionError(err.response?.data?.message || t("common.error"));
    } finally {
      setBusy(false);
    }
  }

  const [showContractModal, setShowContractModal] = useState(false);
  const [contractForm, setContractForm] = useState({ poste: "", type: "CDI", dateDebut: new Date().toISOString().slice(0, 10), dateFin: "", salaire: "" });

  async function handleGeneratePayslip() {
    setBusy(true);
    setActionError("");
    try {
      await addPayslip(id, new Date().toISOString().slice(0, 7));
      await load();
    } catch (err) {
      setActionError(err.response?.data?.message || t("common.error"));
    } finally {
      setBusy(false);
    }
  }

  function handleOpenContractModal() {
    setContractForm({
      poste: employee?.poste || "",
      type: "CDI",
      dateDebut: new Date().toISOString().slice(0, 10),
      dateFin: "",
      salaire: employee?.salaire || "",
    });
    setShowContractModal(true);
  }

  async function handleSubmitContract(ev) {
    ev.preventDefault();
    if (!contractForm.poste.trim() || !contractForm.dateDebut || !contractForm.salaire) return;
    setBusy(true);
    setActionError("");
    try {
      await addContract(id, contractForm);
      setShowContractModal(false);
      await load();
    } catch (err) {
      setActionError(err.response?.data?.message || t("common.error"));
    } finally {
      setBusy(false);
    }
  }

  async function handleWorkCertificate() {
    setActionError("");
    try {
      const url = await generateWorkCertificate(id);
      if (url) {
        window.open(url, "_blank");
        return;
      }
    } catch (err) {
      setActionError(err.response?.data?.message || t("common.error"));
    }
  }

  async function handleRecordAbsence() {
    setBusy(true);
    setActionError("");
    try {
      await addEmployeeAbsence(id, new Date().toISOString().slice(0, 10));
      await load();
    } catch (err) {
      setActionError(err.response?.data?.message || t("common.error"));
    } finally {
      setBusy(false);
    }
  }

  // Prefer the most recent contract from the full history (?all=true) — the base
  // GET /employees/{id} record only reflects the original hire-time contract and
  // doesn't update after adding a new one via POST /employees/{id}/contracts.
  const latestContract = extras.contracts[0];
  const contract = latestContract
    ? { ...latestContract, document: null }
    : employee
    ? {
        type: employee.contratType,
        dateDebut: employee.dateEmbauche,
        dateFin: employee.dateFinContrat,
        salaire: employee.salaire,
        document: null,
      }
    : null;
  const contractHistory = extras.contracts;
  const absences = extras.absences;
  const payslips = extras.payslips;

  if (loading) {
    return <p className="text-gray-400 text-sm">{t("common.loading")}</p>;
  }

  if (!employee) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">{t("hr.notFound")}</p>
        <button onClick={() => navigate("/creche/hr")} className="mt-3 text-teal-600 hover:underline text-sm">
          ← {t("common.cancel")}
        </button>
      </div>
    );
  }

  return (
    <>
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/creche/hr")} className="text-gray-400 hover:text-gray-600">
            ←
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-800">{employee.nom}</h1>
            <p className="text-sm text-gray-500">
              {employee.poste}
              {employee.statut === "inactif" && (
                <span className="ms-2 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
                  {t("hr.statusInactif")}
                </span>
              )}
            </p>
          </div>
        </div>
        {isManager && (
          <div className="flex flex-col sm:flex-row gap-2">
            {employee.statut !== "inactif" && (
              <>
                <button onClick={() => navigate(`/creche/hr/${id}/modifier`)}
                  className="w-full sm:w-auto px-4 py-2 rounded-md border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50">
                  {t("common.edit")}
                </button>
                <button onClick={handleRecordAbsence} disabled={busy}
                  className="w-full sm:w-auto px-4 py-2 rounded-md border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50 disabled:opacity-50">
                  {t("hr.recordAbsence")}
                </button>
                <button onClick={handleWorkCertificate}
                  className="w-full sm:w-auto px-4 py-2 rounded-md border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50">
                  {t("admin.workCertificate")}
                </button>
                <button onClick={handleDeactivate} disabled={busy}
                  className="w-full sm:w-auto px-4 py-2 rounded-md border border-red-300 text-red-600 text-sm font-medium hover:bg-red-50 disabled:opacity-50">
                  {t("hr.deactivate")}
                </button>
              </>
            )}
            {employee.statut === "inactif" && (
              <button onClick={handleRestore} disabled={busy}
                className="w-full sm:w-auto px-4 py-2 rounded-md border border-teal-300 text-teal-700 text-sm font-medium hover:bg-teal-50 disabled:opacity-50">
                {busy ? t("common.loading") : t("hr.restore")}
              </button>
            )}
          </div>
        )}
      </div>

      {actionError && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-2">{actionError}</p>}

      <div className="border-b border-gray-200 overflow-x-auto">
        <div className="flex gap-1 min-w-max">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-medium border-b-2 whitespace-nowrap ${
                activeTab === tab
                  ? "border-teal-600 text-teal-700"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {t(`hr.tab${tab.charAt(0).toUpperCase() + tab.slice(1)}`)}
            </button>
          ))}
        </div>
      </div>

      {activeTab === "profile" && <ProfileTab employee={employee} t={t} />}
      {activeTab === "contract" && <ContractTab contract={contract} history={contractHistory} t={t} isManager={isManager} id={id} navigate={navigate} onOpenContractModal={handleOpenContractModal} />}
      {activeTab === "absences" && <AbsencesTab absences={absences} t={t} />}
      {activeTab === "payslips" && <PayslipsTab payslips={payslips} t={t} navigate={navigate} employee={employee} isManager={isManager} onGeneratePayslip={handleGeneratePayslip} busy={busy} />}
    </div>

      {/* Add contract modal */}
      {showContractModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <form onSubmit={handleSubmitContract} className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md space-y-4">
            <h2 className="font-semibold text-gray-800">{t("hr.updateContract")}</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t("hr.position")}</label>
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
            {actionError && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-2">{actionError}</p>}
            <div className="flex gap-3 justify-end">
              <button type="button" onClick={() => setShowContractModal(false)}
                className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 text-sm hover:bg-gray-50">{t("common.cancel")}</button>
              <button type="submit" disabled={busy}
                className="px-4 py-2 rounded-md bg-teal-600 text-white text-sm font-medium hover:bg-teal-700 disabled:opacity-50">{t("common.save")}</button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}

function ProfileTab({ employee, t }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-sm">
        <InfoRow label={t("hr.position")} value={employee.poste} />
        <InfoRow label={t("hr.phone")} value={employee.telephone} />
        <InfoRow label={t("hr.email")} value={employee.email} />
        <InfoRow label={t("hr.hireDate")} value={employee.dateEmbauche} />
        <InfoRow label={t("hr.baseSalary")} value={`${(employee.salaire || 0).toLocaleString()} DZD`} />
      </div>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div>
      <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">{label}</p>
      <p className="text-gray-800 font-medium">{value || "—"}</p>
    </div>
  );
}

function ContractTab({ contract, history, t, isManager, id, navigate, onOpenContractModal }) {
  if (!contract) return <EmptyState text={t("hr.noContract")} />;
  const olderContracts = history?.slice(1) || [];

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-sm">
          <InfoRow label={t("hr.contractType")} value={contract.type} />
          <InfoRow label={t("hr.startDate")} value={contract.dateDebut} />
          <InfoRow label={t("hr.endDate")} value={contract.dateFin || t("hr.indefinite")} />
          <InfoRow label={t("hr.salary")} value={`${(contract.salaire || 0).toLocaleString()} DZD`} />
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-t border-gray-100 pt-4 gap-3">
          <span className="text-sm text-gray-600">{contract.document}</span>
          <div className="flex gap-3">
            <button
              onClick={() => navigate(`/creche/hr/${id}/contrat`)}
              className="text-sm text-teal-600 hover:underline"
            >
              {t("docs.printContract")}
            </button>
            {isManager && (
              <button onClick={onOpenContractModal} className="text-sm text-gray-500 hover:text-gray-700">
                {t("hr.updateContract")}
              </button>
            )}
          </div>
        </div>
      </div>

      {olderContracts.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-gray-400 uppercase tracking-wide">{t("hr.contractHistory")}</p>
          {olderContracts.map((c) => (
            <div key={c.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 text-sm text-gray-600 flex items-center justify-between">
              <span>{c.type} · {c.poste}</span>
              <span>{c.dateDebut} → {c.dateFin || t("hr.indefinite")}</span>
              <span>{(c.salaire || 0).toLocaleString()} DZD</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AbsencesTab({ absences, t }) {
  if (absences.length === 0) return <EmptyState text={t("hr.noAbsences")} />;
  return (
    <div className="space-y-3">
      {absences.map((a) => (
        <div
          key={a.id}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex items-center justify-between"
        >
          <div>
            <p className="font-medium text-gray-800">{a.date}</p>
            <p className="text-sm text-gray-500">{a.motif}</p>
          </div>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            a.justifie ? "bg-green-50 text-green-700" : "bg-yellow-50 text-yellow-700"
          }`}>
            {a.justifie ? t("children.justified") : t("children.unjustified")}
          </span>
        </div>
      ))}
    </div>
  );
}

function PayslipsTab({ payslips, t, navigate, employee, isManager, onGeneratePayslip, busy }) {
  return (
    <div className="space-y-3">
      {isManager && (
        <div className="flex justify-end">
          <button onClick={onGeneratePayslip} disabled={busy}
            className="px-3 py-1.5 rounded-md bg-teal-600 text-white text-sm font-medium hover:bg-teal-700 disabled:opacity-50">
            {busy ? t("common.loading") : t("hr.generatePayslip")}
          </button>
        </div>
      )}
      {payslips.length === 0 && <EmptyState text={t("hr.noPayslips")} />}
      {payslips.map((p) => (
        <div
          key={p.id}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex items-center justify-between"
        >
          <div
            className="flex-1 cursor-pointer"
            onClick={() => navigate(`/creche/hr/payslips/${p.id}`, { state: { payslip: p, employee } })}
          >
            <p className="font-medium text-gray-800">{p.mois}</p>
            <p className="text-sm text-gray-500">{p.net.toLocaleString()} DZD</p>
          </div>
          <div className="flex items-center gap-3">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              p.statut === "valide" ? "bg-green-50 text-green-700" : "bg-yellow-50 text-yellow-700"
            }`}>
              {p.statut === "valide" ? t("hr.validated") : t("hr.pending")}
            </span>
            <button
              onClick={() => navigate(`/creche/hr/payslips/${p.id}/pdf`, { state: { payslip: p, employee } })}
              className="text-xs text-teal-600 hover:underline whitespace-nowrap"
            >
              {t("hr.downloadPdf")}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState({ text }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center text-gray-400">
      {text}
    </div>
  );
}
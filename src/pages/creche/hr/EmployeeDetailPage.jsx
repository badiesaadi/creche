import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { fetchEmployee, fetchEmployeeFull, restoreEmployee, deleteEmployee, addEmployeeAbsence } from "../../../lib/api/employees.js";
import { useAuth } from "../../../lib/auth/AuthContext.jsx";

const tabs = ["profile", "contract", "absences", "payslips"];

// The backend's /employees/{id}/all shape isn't pinned down by the spec's
// examples, so we read a few likely key names defensively.
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
  return { absences, payslips };
}

export default function EmployeeDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useAuth();
  const isManager = user?.role === "manager";
  const [activeTab, setActiveTab] = useState("profile");

  const [employee, setEmployee] = useState(null);
  const [extras, setExtras] = useState({ absences: [], payslips: [] });
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

  const contract = employee
    ? {
        type: employee.contratType,
        dateDebut: employee.dateEmbauche,
        dateFin: employee.dateFinContrat,
        salaire: employee.salaire,
        document: null,
      }
    : null;
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
      {activeTab === "contract" && <ContractTab contract={contract} t={t} isManager={isManager} id={id} navigate={navigate} />}
      {activeTab === "absences" && <AbsencesTab absences={absences} t={t} />}
      {activeTab === "payslips" && <PayslipsTab payslips={payslips} t={t} navigate={navigate} employee={employee} />}
    </div>
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

function ContractTab({ contract, t, isManager, id, navigate }) {
  if (!contract) return <EmptyState text={t("hr.noContract")} />;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-sm">
        <InfoRow label={t("hr.contractType")} value={contract.type} />
        <InfoRow label={t("hr.startDate")} value={contract.dateDebut} />
        <InfoRow label={t("hr.endDate")} value={contract.dateFin || t("hr.indefinite")} />
        <InfoRow label={t("hr.salary")} value={`${contract.salaire.toLocaleString()} DZD`} />
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
            <button className="text-sm text-gray-500 hover:text-gray-700">
              {t("hr.updateContract")}
            </button>
          )}
        </div>
      </div>
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

function PayslipsTab({ payslips, t, navigate, employee }) {
  if (payslips.length === 0) return <EmptyState text={t("hr.noPayslips")} />;
  return (
    <div className="space-y-3">
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
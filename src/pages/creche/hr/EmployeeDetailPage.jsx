import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { mockEmployees, mockContracts, mockStaffAbsences, mockPayslips } from "../../../data/mockEmployees.js";
import { useAuth } from "../../../lib/auth/AuthContext.jsx";

const tabs = ["profile", "contract", "absences", "payslips"];

export default function EmployeeDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useAuth();
  const isManager = user?.role === "manager";
  const [activeTab, setActiveTab] = useState("profile");

  // TODO: replace with real API call -> apiClient.get(`/employees/${id}`)
  const employee = mockEmployees.find((e) => String(e.id) === id);
  const contract = mockContracts[id];
  const absences = mockStaffAbsences.filter((a) => String(a.employeeId) === id);
  const payslips = mockPayslips.filter((p) => String(p.employeeId) === id);

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
      <div className="flex items-center gap-3">
        <button onClick={() => navigate("/creche/hr")} className="text-gray-400 hover:text-gray-600">
          ←
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-800">{employee.nom}</h1>
          <p className="text-sm text-gray-500">{employee.poste}</p>
        </div>
      </div>

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
      {activeTab === "payslips" && <PayslipsTab payslips={payslips} t={t} navigate={navigate} />}
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
        <InfoRow label={t("hr.baseSalary")} value={`${employee.salaireBase.toLocaleString()} DZD`} />
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

function PayslipsTab({ payslips, t, navigate }) {
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
            onClick={() => navigate(`/creche/hr/payslips/${p.id}`)}
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
              onClick={() => navigate(`/creche/hr/payslips/${p.id}/pdf`)}
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
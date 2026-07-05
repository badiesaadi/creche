import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { mockEmployees, mockContracts } from "../../../data/mockEmployees.js";
import { mockSettings } from "../../../data/mockSettings.js";
import PrintLayout from "../../../components/shared/PrintLayout.jsx";

export default function WorkContractPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();

  // TODO: replace with real API call -> apiClient.get(`/employees/${id}/contract`)
  const employee = mockEmployees.find((e) => String(e.id) === id);
  const contract = mockContracts[id];

  if (!employee || !contract) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">{t("hr.notFound")}</p>
      </div>
    );
  }

  const today = new Date().toLocaleDateString("fr-DZ");

  return (
    <PrintLayout onClose={() => navigate(`/creche/hr/${id}`)}>
      {/* Header */}
      <div className="text-center border-b border-gray-200 pb-6">
        <h1 className="text-2xl font-bold text-gray-800">{mockSettings.nom}</h1>
        <p className="text-sm text-gray-500 mt-1">{mockSettings.adresse}</p>
      </div>

      {/* Title */}
      <div className="text-center">
        <h2 className="text-xl font-bold text-gray-800 uppercase tracking-wide">
          {t("docs.workContract")} — {contract.type}
        </h2>
      </div>

      {/* Parties */}
      <div className="space-y-3 text-sm text-gray-700">
        <p className="font-semibold text-gray-800">{t("docs.between")}:</p>
        <p>
          <span className="font-medium">{t("docs.employer")}:</span> {mockSettings.nom}, {mockSettings.adresse}
        </p>
        <p>
          <span className="font-medium">{t("docs.employee")}:</span> {employee.nom}
        </p>
      </div>

      {/* Contract details */}
      <div className="border border-gray-200 rounded-md p-4 space-y-2 text-sm">
        <DocRow label={t("hr.contractType")} value={contract.type} />
        <DocRow label={t("hr.position")} value={employee.poste} />
        <DocRow label={t("hr.startDate")} value={contract.dateDebut} />
        <DocRow label={t("hr.endDate")} value={contract.dateFin || t("hr.indefinite")} />
        <DocRow label={t("hr.salary")} value={`${contract.salaire.toLocaleString()} DZD ${t("docs.perMonth")}`} />
      </div>

      {/* Clauses */}
      <div className="text-sm text-gray-600 space-y-2">
        <p className="font-semibold text-gray-700">{t("docs.clauses")}:</p>
        <p>1. {t("docs.clause1")}</p>
        <p>2. {t("docs.clause2")}</p>
        <p>3. {t("docs.clause3")}</p>
      </div>

      {/* Signatures */}
      <div className="flex justify-between items-end pt-6">
        <div className="text-center text-sm text-gray-600">
          <p className="mb-10">{t("docs.employerSignature")}</p>
          <div className="border-t border-gray-400 w-40" />
        </div>
        <div className="text-center text-sm text-gray-600">
          <p className="mb-10">{t("docs.employeeSignature")}</p>
          <div className="border-t border-gray-400 w-40" />
        </div>
      </div>

      <p className="text-xs text-gray-400 text-center">{t("docs.issuedOn", { date: today })}</p>
    </PrintLayout>
  );
}

function DocRow({ label, value }) {
  return (
    <div className="flex gap-2">
      <span className="font-medium text-gray-600 w-40 shrink-0">{label}:</span>
      <span className="text-gray-800">{value}</span>
    </div>
  );
}
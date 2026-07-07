import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { fetchEmployee } from "../../../lib/api/employees.js";
import { fetchCreche } from "../../../lib/api/creches.js";
import { useAuth } from "../../../lib/auth/AuthContext.jsx";
import PrintLayout from "../../../components/shared/PrintLayout.jsx";

export default function WorkContractPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useAuth();

  const [employee, setEmployee] = useState(null);
  const [creche, setCreche] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetchEmployee(id),
      user?.crecheId ? fetchCreche(user.crecheId).catch(() => null) : Promise.resolve(null),
    ])
      .then(([emp, crecheData]) => {
        setEmployee(emp);
        setCreche(crecheData);
      })
      .catch(() => setEmployee(null))
      .finally(() => setLoading(false));
  }, [id, user?.crecheId]);

  if (loading) {
    return <p className="text-gray-400 text-sm">{t("common.loading")}</p>;
  }

  if (!employee || !employee.dateEmbauche) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">{t("hr.notFound")}</p>
      </div>
    );
  }

  const contract = {
    type: employee.contratType,
    dateDebut: employee.dateEmbauche,
    dateFin: employee.dateFinContrat,
    salaire: employee.salaire,
  };

  const today = new Date().toLocaleDateString("fr-DZ");

  return (
    <PrintLayout onClose={() => navigate(`/creche/hr/${id}`)}>
      {/* Header */}
      <div className="text-center border-b border-gray-200 pb-6">
        <h1 className="text-2xl font-bold text-gray-800">{creche?.nom || employee.creche || ""}</h1>
        <p className="text-sm text-gray-500 mt-1">{creche?.adresse || ""}</p>
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
          <span className="font-medium">{t("docs.employer")}:</span> {creche?.nom || employee.creche || ""}, {creche?.adresse || ""}
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
        <DocRow label={t("hr.salary")} value={`${(contract.salaire || 0).toLocaleString()} DZD ${t("docs.perMonth")}`} />
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

import { useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import PrintLayout from "../../../components/shared/PrintLayout.jsx";

// No standalone "GET payslip by id" endpoint exists on the backend, so this
// page relies on payslip + employee being passed via navigation state from
// EmployeeDetailPage's payslips tab (same approach as PayslipViewPage).
export default function PayslipPDFPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();

  const payslip = location.state?.payslip;
  const employee = location.state?.employee;

  if (!payslip || !employee) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">{t("hr.notFound")}</p>
        <button onClick={() => navigate(-1)} className="mt-3 text-teal-600 hover:underline text-sm">
          ← {t("common.cancel")}
        </button>
      </div>
    );
  }

  const deductions = (employee.salaire || 0) - (payslip.net || 0);

  return (
    <PrintLayout onClose={() => navigate(`/creche/hr/${employee.id}`)}>
      {/* Header */}
      <div className="text-center border-b border-gray-200 pb-6">
        <h1 className="text-2xl font-bold text-gray-800">{employee.creche || ""}</h1>
      </div>

      {/* Title */}
      <div className="text-center">
        <h2 className="text-xl font-bold text-gray-800 uppercase tracking-wide">
          {t("hr.payslip")} — {payslip.mois}
        </h2>
      </div>

      {/* Employee info */}
      <div className="border border-gray-200 rounded-md p-4 space-y-2 text-sm">
        <DocRow label={t("hr.employee")} value={employee.nom} />
        <DocRow label={t("hr.position")} value={employee.poste} />
        <DocRow label={t("hr.hireDate")} value={employee.dateEmbauche} />
      </div>

      {/* Salary breakdown */}
      <div className="space-y-2 text-sm">
        <div className="flex justify-between py-2 border-b border-gray-100">
          <span className="text-gray-600">{t("hr.baseSalary")}</span>
          <span className="font-medium text-gray-800">{(employee.salaire || 0).toLocaleString()} DZD</span>
        </div>
        <div className="flex justify-between py-2 border-b border-gray-100">
          <span className="text-gray-600">{t("docs.deductions")}</span>
          <span className="font-medium text-red-600">- {deductions.toLocaleString()} DZD</span>
        </div>
        <div className="flex justify-between py-3 font-bold text-base">
          <span className="text-gray-800">{t("hr.netSalary")}</span>
          <span className="text-teal-700">{(payslip.net || 0).toLocaleString()} DZD</span>
        </div>
      </div>

      {/* Status */}
      <div className="text-center">
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
          payslip.statut === "valide" ? "bg-green-50 text-green-700" : "bg-yellow-50 text-yellow-700"
        }`}>
          {payslip.statut === "valide" ? t("hr.validated") : t("hr.pending")}
        </span>
      </div>

      <p className="text-xs text-gray-400 text-center">
        {t("docs.issuedOn", { date: new Date().toLocaleDateString("fr-DZ") })}
      </p>
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

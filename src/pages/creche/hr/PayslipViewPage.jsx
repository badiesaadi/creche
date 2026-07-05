import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { mockPayslips, mockEmployees } from "../../../data/mockEmployees.js";

export default function PayslipViewPage() {
  const { payslipId } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();

  // TODO: replace with real API call -> apiClient.get(`/payslips/${payslipId}`)
  const payslip = mockPayslips.find((p) => String(p.id) === payslipId);
  const employee = payslip ? mockEmployees.find((e) => e.id === payslip.employeeId) : null;

  if (!payslip || !employee) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">{t("hr.notFound")}</p>
      </div>
    );
  }

  return (
    <div className="max-w-xl space-y-5">
      <div className="flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-gray-600">
          ← {t("common.cancel")}
        </button>
        <button
          onClick={() => navigate(`/creche/hr/payslips/${payslipId}/pdf`)}
          className="px-4 py-2 rounded-md bg-teal-600 text-white text-sm font-medium hover:bg-teal-700"
        >
          {t("hr.downloadPdf")}
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-5">
        <div className="text-center border-b border-gray-100 pb-4">
          <h2 className="font-bold text-gray-800 text-lg">{t("hr.payslip")}</h2>
          <p className="text-sm text-gray-500">{payslip.mois}</p>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-xs text-gray-400 uppercase">{t("hr.employee")}</p>
            <p className="font-medium text-gray-800">{employee.nom}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase">{t("hr.position")}</p>
            <p className="font-medium text-gray-800">{employee.poste}</p>
          </div>
        </div>

        <div className="border-t border-gray-100 pt-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">{t("hr.baseSalary")}</span>
            <span className="text-gray-800">{employee.salaireBase.toLocaleString()} DZD</span>
          </div>
          <div className="flex justify-between font-semibold border-t border-gray-100 pt-2">
            <span className="text-gray-700">{t("hr.netSalary")}</span>
            <span className="text-teal-700">{payslip.net.toLocaleString()} DZD</span>
          </div>
        </div>

        <div className="text-center pt-2">
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
            payslip.statut === "valide" ? "bg-green-50 text-green-700" : "bg-yellow-50 text-yellow-700"
          }`}>
            {payslip.statut === "valide" ? t("hr.validated") : t("hr.pending")}
          </span>
        </div>
      </div>
    </div>
  );
}
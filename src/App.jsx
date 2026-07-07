import { useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import LoginPage from "./pages/auth/LoginPage.jsx";
import ProtectedRoute from "./components/shared/ProtectedRoute.jsx";
import CrecheLayout from "./layouts/CrecheLayout.jsx";
import AdminLayout from "./layouts/AdminLayout.jsx";

// Creche pages
import ChildrenListPage from "./pages/creche/enfants/ChildrenListPage.jsx";
import ChildEnrollmentPage from "./pages/creche/enfants/ChildEnrollmentPage.jsx";
import ChildDetailPage from "./pages/creche/enfants/ChildDetailPage.jsx";
import AbsenceTrackingPage from "./pages/creche/enfants/AbsenceTrackingPage.jsx";
import ChildWithdrawalPage from "./pages/creche/enfants/ChildWithdrawalPage.jsx";
import ClassesListPage from "./pages/creche/classes/ClassesListPage.jsx";
import ClassFormPage from "./pages/creche/classes/ClassFormPage.jsx";
import ClassDetailPage from "./pages/creche/classes/ClassDetailPage.jsx";
import PaymentsDashboardPage from "./pages/creche/payments/PaymentsDashboardPage.jsx";
import RecordPaymentPage from "./pages/creche/payments/RecordPaymentPage.jsx";
import RemindersPage from "./pages/creche/payments/RemindersPage.jsx";
import PaymentSchedulePage from "./pages/creche/payments/PaymentSchedulePage.jsx";
import EmployeesListPage from "./pages/creche/hr/EmployeesListPage.jsx";
import EmployeeDetailPage from "./pages/creche/hr/EmployeeDetailPage.jsx";
import PayslipViewPage from "./pages/creche/hr/PayslipViewPage.jsx";
import AddEmployeePage from "./pages/creche/hr/AddEmployeePage.jsx";
import EmployeeEditPage from "./pages/creche/hr/EmployeeEditPage.jsx";
import SettingsPage from "./pages/creche/settings/SettingsPage.jsx";
import NotificationsPage from "./pages/creche/notifications/NotificationsPage.jsx";

// Documents
import EnrollmentCertificatePage from "./pages/creche/documents/EnrollmentCertificatePage.jsx";
import WorkContractPage from "./pages/creche/documents/WorkContractPage.jsx";
import PayslipPDFPage from "./pages/creche/documents/PayslipPDFPage.jsx";
import EvaluationReportPage from "./pages/creche/documents/EvaluationReportPage.jsx";

// Admin pages
import AdminDashboardPage from "./pages/admin/AdminDashboardPage.jsx";
import AdminCrechesPage from "./pages/admin/AdminCrechesPage.jsx";
import AdminCrecheFormPage from "./pages/admin/AdminCrecheFormPage.jsx";
import AdminCrecheDetailPage from "./pages/admin/AdminCrecheDetailPage.jsx";
import AdminHRPage from "./pages/admin/AdminHRPage.jsx";
import AdminFinancePage from "./pages/admin/AdminFinancePage.jsx";
import AdminReportsPage from "./pages/admin/AdminReportsPage.jsx";
import AdminChildrenPage from "./pages/admin/AdminChildrenPage.jsx";
import AdminExpensesPage from "./pages/admin/AdminExpensesPage.jsx";
import CrecheDashboardPage from "./pages/creche/dashboard/CrecheDashboardPage.jsx";

export default function App() {
  const { i18n } = useTranslation();

  useEffect(() => {
    document.documentElement.dir = i18n.language === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = i18n.language;
  }, [i18n.language]);

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<Navigate to="/login" replace />} />

      {/* ── Crèche platform ── */}
      <Route path="/creche" element={<ProtectedRoute allowedRoles={["manager", "teacher"]}><CrecheLayout /></ProtectedRoute>}>
        <Route path="dashboard" element={<CrecheDashboardPage />} />

        {/* enfants — static before :id */}
        <Route path="enfants" element={<ChildrenListPage />} />
        <Route path="enfants/nouveau" element={<ProtectedRoute allowedRoles={["manager"]}><ChildEnrollmentPage /></ProtectedRoute>} />
        <Route path="enfants/absences" element={<AbsenceTrackingPage />} />
        <Route path="enfants/:id/sortie" element={<ProtectedRoute allowedRoles={["manager"]}><ChildWithdrawalPage /></ProtectedRoute>} />
        <Route path="enfants/:id/modifier" element={<ProtectedRoute allowedRoles={["manager"]}><ChildEnrollmentPage /></ProtectedRoute>} />
        <Route path="enfants/:id/certificat" element={<ProtectedRoute allowedRoles={["manager"]}><EnrollmentCertificatePage /></ProtectedRoute>} />
        <Route path="enfants/:id/evaluation-report" element={<ProtectedRoute allowedRoles={["manager"]}><EvaluationReportPage /></ProtectedRoute>} />
        <Route path="enfants/:id" element={<ChildDetailPage />} />

        {/* classes */}
        <Route path="classes" element={<ClassesListPage />} />
        <Route path="classes/nouveau" element={<ProtectedRoute allowedRoles={["manager"]}><ClassFormPage /></ProtectedRoute>} />
        <Route path="classes/:id/modifier" element={<ProtectedRoute allowedRoles={["manager"]}><ClassFormPage /></ProtectedRoute>} />
        <Route path="classes/:id" element={<ClassDetailPage />} />

        {/* payments */}
        <Route path="payments" element={<PaymentsDashboardPage />} />
        <Route path="payments/nouveau" element={<ProtectedRoute allowedRoles={["manager"]}><RecordPaymentPage /></ProtectedRoute>} />
        <Route path="payments/rappels" element={<ProtectedRoute allowedRoles={["manager"]}><RemindersPage /></ProtectedRoute>} />
        <Route path="payments/schedule/:childId" element={<ProtectedRoute allowedRoles={["manager"]}><PaymentSchedulePage /></ProtectedRoute>} />

        {/* hr — static before :id */}
        <Route path="hr" element={<ProtectedRoute allowedRoles={["manager"]}><EmployeesListPage /></ProtectedRoute>} />
        <Route path="hr/nouveau" element={<ProtectedRoute allowedRoles={["manager"]}><AddEmployeePage /></ProtectedRoute>} />
        <Route path="hr/payslips/:payslipId/pdf" element={<ProtectedRoute allowedRoles={["manager"]}><PayslipPDFPage /></ProtectedRoute>} />
        <Route path="hr/payslips/:payslipId" element={<ProtectedRoute allowedRoles={["manager"]}><PayslipViewPage /></ProtectedRoute>} />
        <Route path="hr/:id/contrat" element={<ProtectedRoute allowedRoles={["manager"]}><WorkContractPage /></ProtectedRoute>} />
        <Route path="hr/:id/modifier" element={<ProtectedRoute allowedRoles={["manager"]}><EmployeeEditPage /></ProtectedRoute>} />
        <Route path="hr/:id" element={<ProtectedRoute allowedRoles={["manager"]}><EmployeeDetailPage /></ProtectedRoute>} />

        <Route path="settings" element={<ProtectedRoute allowedRoles={["manager"]}><SettingsPage /></ProtectedRoute>} />
        <Route path="notifications" element={<NotificationsPage />} />
      </Route>

      {/* ── Admin platform ── */}
      <Route path="/admin" element={<ProtectedRoute allowedRoles={["admin"]}><AdminLayout /></ProtectedRoute>}>
        <Route path="dashboard" element={<AdminDashboardPage />} />
        <Route path="creches" element={<AdminCrechesPage />} />
        <Route path="creches/nouveau" element={<AdminCrecheFormPage />} />
        <Route path="creches/:id/modifier" element={<AdminCrecheFormPage />} />
        <Route path="creches/:id" element={<AdminCrecheDetailPage />} />
        <Route path="hr" element={<AdminHRPage />} />
        <Route path="finance" element={<AdminFinancePage />} />
        <Route path="expenses" element={<AdminExpensesPage />} />
        <Route path="reports" element={<AdminReportsPage />} />
        <Route path="children" element={<AdminChildrenPage />} />
      </Route>
    </Routes>
  );
}

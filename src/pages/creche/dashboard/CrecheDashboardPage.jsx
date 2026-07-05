import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../../lib/auth/AuthContext.jsx";
import { mockChildren } from "../../../data/mockChildren.js";
import { mockClasses } from "../../../data/mockClasses.js";
import { mockPayments } from "../../../data/mockPayments.js";
import { mockAbsencesLog } from "../../../data/mockChildren.js";

export default function CrecheDashboardPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isManager = user?.role === "manager";

  // TODO: replace with real API calls
  const activeChildren = mockChildren.filter((c) => c.statut === "actif");
  const overduePayments = mockPayments.filter((p) => p.statut === "en_retard");
  const unjustifiedAbsences = mockAbsencesLog.filter((a) => !a.justifie);
  const classCount = mockClasses.length;

  const recentAbsences = mockAbsencesLog.slice(0, 3);
  const recentOverdue = overduePayments.slice(0, 3);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-800">{t("nav.dashboard")}</h1>
        <p className="text-sm text-gray-500 mt-0.5">{t("dashboard.welcome", { name: user?.nom })}</p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          label={t("dashboard.activeChildren")}
          value={activeChildren.length}
          color="text-teal-700"
          onClick={() => navigate("/creche/enfants")}
        />
        <KPICard
          label={t("dashboard.classes")}
          value={classCount}
          color="text-blue-700"
          onClick={() => navigate("/creche/classes")}
        />
        {isManager && (
          <KPICard
            label={t("dashboard.overduePayments")}
            value={overduePayments.length}
            color={overduePayments.length > 0 ? "text-red-600" : "text-green-600"}
            onClick={() => navigate("/creche/payments")}
          />
        )}
        <KPICard
          label={t("dashboard.unjustifiedAbsences")}
          value={unjustifiedAbsences.length}
          color={unjustifiedAbsences.length > 0 ? "text-yellow-600" : "text-green-600"}
          onClick={() => navigate("/creche/enfants/absences")}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Recent absences */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-700">{t("dashboard.recentAbsences")}</h2>
            <button onClick={() => navigate("/creche/enfants/absences")} className="text-xs text-teal-600 hover:underline">
              {t("admin.viewAll")}
            </button>
          </div>
          {recentAbsences.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">{t("common.noResults")}</p>
          ) : (
            <div className="space-y-2">
              {recentAbsences.map((a) => (
                <div
                  key={a.id}
                  onClick={() => navigate(`/creche/enfants/${a.childId}`)}
                  className="flex items-center justify-between px-3 py-2 rounded-md hover:bg-gray-50 cursor-pointer"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-800">{a.childName}</p>
                    <p className="text-xs text-gray-500">{a.date} · {a.motif}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    a.justifie ? "bg-green-50 text-green-700" : "bg-yellow-50 text-yellow-700"
                  }`}>
                    {a.justifie ? t("children.justified") : t("children.unjustified")}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Overdue payments — manager only */}
        {isManager ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-gray-700">{t("dashboard.overduePayments")}</h2>
              <button onClick={() => navigate("/creche/payments")} className="text-xs text-teal-600 hover:underline">
                {t("admin.viewAll")}
              </button>
            </div>
            {recentOverdue.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">{t("common.noResults")}</p>
            ) : (
              <div className="space-y-2">
                {recentOverdue.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => navigate(`/creche/enfants/${p.childId}`)}
                    className="flex items-center justify-between px-3 py-2 rounded-md hover:bg-gray-50 cursor-pointer"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-800">{p.childName}</p>
                      <p className="text-xs text-gray-500">{p.date}</p>
                    </div>
                    <span className="text-sm font-semibold text-red-600">
                      {p.montant.toLocaleString()} DZD
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* Teacher: show classes instead */
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-gray-700">{t("nav.classes")}</h2>
              <button onClick={() => navigate("/creche/classes")} className="text-xs text-teal-600 hover:underline">
                {t("admin.viewAll")}
              </button>
            </div>
            <div className="space-y-2">
              {mockClasses.map((c) => (
                <div
                  key={c.id}
                  onClick={() => navigate(`/creche/classes/${c.id}`)}
                  className="flex items-center justify-between px-3 py-2 rounded-md hover:bg-gray-50 cursor-pointer"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-800">{c.nom}</p>
                    <p className="text-xs text-gray-500">{c.tranche} · {c.enseignant}</p>
                  </div>
                  <span className="text-sm text-gray-500">
                    {c.enfantIds.length}/{c.seuilMax}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Quick actions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
        <h2 className="font-semibold text-gray-700 mb-3">{t("dashboard.quickActions")}</h2>
        <div className="flex flex-wrap gap-2">
          <ActionButton label={t("children.addNew")} onClick={() => navigate("/creche/enfants/nouveau")} />
          <ActionButton label={t("children.absenceTracking")} onClick={() => navigate("/creche/enfants/absences")} />
          {isManager && (
            <>
              <ActionButton label={t("payments.recordPayment")} onClick={() => navigate("/creche/payments/nouveau")} />
              <ActionButton label={t("hr.addEmployee")} onClick={() => navigate("/creche/hr/nouveau")} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function KPICard({ label, value, color, onClick }) {
  return (
    <div
      onClick={onClick}
      className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 cursor-pointer hover:shadow-md transition-shadow"
    >
      <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">{label}</p>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
    </div>
  );
}

function ActionButton({ label, onClick }) {
  return (
    <button
      onClick={onClick}
      className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50"
    >
      {label}
    </button>
  );
}

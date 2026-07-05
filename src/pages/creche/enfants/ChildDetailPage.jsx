import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { mockChildren, mockChildExtras } from "../../../data/mockChildren.js";

const tabs = ["profile", "payments", "absences", "evaluations"];

const statusStyles = {
  actif: "bg-green-50 text-green-700",
  en_attente: "bg-yellow-50 text-yellow-700",
  retire: "bg-gray-100 text-gray-500",
};

export default function ChildDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState("profile");

  // TODO: replace with real API call -> apiClient.get(`/children/${id}`)
  const child = mockChildren.find((c) => String(c.id) === id);
  const extras = mockChildExtras[id] || { payments: [], absences: [], evaluations: [] };

  if (!child) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">{t("children.notFound")}</p>
        <button onClick={() => navigate("/creche/enfants")} className="mt-3 text-teal-600 hover:underline text-sm">
          ← {t("common.cancel")}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/creche/enfants")} className="text-gray-400 hover:text-gray-600">
            ←
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-800">{child.prenom} {child.nom}</h1>
            <span className={`inline-block mt-1 px-2 py-1 rounded-full text-xs font-medium ${statusStyles[child.statut]}`}>
              {t(`children.status${child.statut.charAt(0).toUpperCase() + child.statut.slice(1)}`)}
            </span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <button
            onClick={() => navigate(`/creche/enfants/${id}/certificat`)}
            className="w-full sm:w-auto px-4 py-2 rounded-md border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50"
          >
            {t("docs.certificate")}
          </button>
          {child.statut !== "retire" && (
            <button
              onClick={() => navigate(`/creche/enfants/${id}/sortie`)}
              className="w-full sm:w-auto px-4 py-2 rounded-md border border-red-300 text-red-600 text-sm font-medium hover:bg-red-50"
            >
              {t("children.withdraw")}
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
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
              {t(`children.tab${tab.charAt(0).toUpperCase() + tab.slice(1)}`)}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      {activeTab === "profile" && <ProfileTab child={child} t={t} />}
      {activeTab === "payments" && <PaymentsTab payments={extras.payments} t={t} />}
      {activeTab === "absences" && <AbsencesTab absences={extras.absences} t={t} />}
      {activeTab === "evaluations" && (
        <EvaluationsTab
          evaluations={extras.evaluations}
          t={t}
          onPrintReport={() => navigate(`/creche/enfants/${id}/evaluation-report`)}
        />
      )}
    </div>
  );
}

function ProfileTab({ child, t }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-sm">
        <InfoRow label={t("children.birthDate")} value={child.dateNaissance} />
        <InfoRow label={t("children.gender")} value={child.sexe === "F" ? t("children.female") : t("children.male")} />
        <InfoRow label={t("children.parentName")} value={child.parentNom} />
        <InfoRow label={t("children.parentPhone")} value={child.parentTelephone} />
        <InfoRow label={t("children.enrollmentDate")} value={child.dateInscription} />
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

function PaymentsTab({ payments, t }) {
  if (payments.length === 0) return <EmptyState text={t("children.noPayments")} />;
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
          <tr>
            <th className="text-start px-4 py-3">{t("children.date")}</th>
            <th className="text-start px-4 py-3">{t("children.amount")}</th>
            <th className="text-start px-4 py-3">{t("children.method")}</th>
            <th className="text-start px-4 py-3">{t("children.status")}</th>
          </tr>
        </thead>
        <tbody>
          {payments.map((p) => (
            <tr key={p.id} className="border-t border-gray-100">
              <td className="px-4 py-3 text-gray-600">{p.date}</td>
              <td className="px-4 py-3 font-medium text-gray-800">{p.montant.toLocaleString()} DZD</td>
              <td className="px-4 py-3 text-gray-600">{p.methode}</td>
              <td className="px-4 py-3">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  p.statut === "paye" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"
                }`}>
                  {p.statut === "paye" ? t("children.paid") : t("children.overdue")}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function AbsencesTab({ absences, t }) {
  if (absences.length === 0) return <EmptyState text={t("children.noAbsences")} />;
  return (
    <div className="space-y-3">
      {absences.map((a) => (
        <div key={a.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex items-center justify-between">
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

function EvaluationsTab({ evaluations, t, onPrintReport }) {
  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <button onClick={onPrintReport} className="text-sm text-teal-600 hover:underline">
          {t("docs.printReport")}
        </button>
      </div>
      {evaluations.length === 0 ? (
        <EmptyState text={t("children.noEvaluations")} />
      ) : (
        evaluations.map((e) => (
          <div key={e.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-1">
              <span className="font-medium text-gray-800">{e.domaine}</span>
              <span className="text-xs text-gray-400">{e.date}</span>
            </div>
            <p className="text-sm text-gray-600">{e.note}</p>
            <p className="text-xs text-gray-400 mt-1">{t("children.evaluatedBy")}: {e.evaluePar}</p>
          </div>
        ))
      )}
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

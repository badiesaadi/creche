import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { mockChildren, mockChildExtras } from "../../../data/mockChildren.js";
import { mockSettings } from "../../../data/mockSettings.js";
import PrintLayout from "../../../components/shared/PrintLayout.jsx";

export default function EvaluationReportPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();

  // TODO: replace with real API call -> apiClient.get(`/children/${id}/evaluations`)
  const child = mockChildren.find((c) => String(c.id) === id);
  const evaluations = mockChildExtras[id]?.evaluations || [];

  if (!child) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">{t("children.notFound")}</p>
      </div>
    );
  }

  return (
    <PrintLayout onClose={() => navigate(`/creche/enfants/${id}`)}>
      {/* Header */}
      <div className="text-center border-b border-gray-200 pb-6">
        <h1 className="text-2xl font-bold text-gray-800">{mockSettings.nom}</h1>
        <p className="text-sm text-gray-500">{mockSettings.adresse}</p>
      </div>

      {/* Title */}
      <div className="text-center">
        <h2 className="text-xl font-bold text-gray-800 uppercase tracking-wide">
          {t("docs.evaluationReport")}
        </h2>
        <p className="text-sm text-gray-500 mt-1">{child.prenom} {child.nom}</p>
      </div>

      {/* Child info */}
      <div className="border border-gray-200 rounded-md p-4 space-y-2 text-sm">
        <DocRow label={t("children.fullName")} value={`${child.prenom} ${child.nom}`} />
        <DocRow label={t("children.birthDate")} value={child.dateNaissance} />
        <DocRow label={t("children.parentName")} value={child.parentNom} />
      </div>

      {/* Evaluations */}
      {evaluations.length === 0 ? (
        <p className="text-center text-gray-400 py-4">{t("children.noEvaluations")}</p>
      ) : (
        <div className="space-y-3">
          {evaluations.map((e, i) => (
            <div key={i} className="border border-gray-100 rounded-md p-3 space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="font-semibold text-gray-700">{e.domaine}</span>
                <span className="text-xs text-gray-400">{e.date}</span>
              </div>
              <p className="text-gray-600">{e.note}</p>
              <p className="text-xs text-gray-400">{t("children.evaluatedBy")}: {e.evaluePar}</p>
            </div>
          ))}
        </div>
      )}

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
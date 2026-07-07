import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { fetchChild } from "../../../lib/api/children.js";
import { fetchCreche } from "../../../lib/api/creches.js";
import { useAuth } from "../../../lib/auth/AuthContext.jsx";
import PrintLayout from "../../../components/shared/PrintLayout.jsx";

export default function EnrollmentCertificatePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useAuth();

  const [child, setChild] = useState(null);
  const [creche, setCreche] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetchChild(id),
      user?.crecheId ? fetchCreche(user.crecheId).catch(() => null) : Promise.resolve(null),
    ])
      .then(([childData, crecheData]) => {
        setChild(childData);
        setCreche(crecheData);
      })
      .catch(() => setChild(null))
      .finally(() => setLoading(false));
  }, [id, user?.crecheId]);

  if (loading) {
    return <p className="text-gray-400 text-sm">{t("common.loading")}</p>;
  }

  if (!child) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">{t("children.notFound")}</p>
      </div>
    );
  }

  const today = new Date().toLocaleDateString("fr-DZ");
  const crecheName = creche?.nom || "";

  return (
    <PrintLayout onClose={() => navigate(`/creche/enfants/${id}`)}>
      {/* Header */}
      <div className="text-center border-b border-gray-200 pb-6">
        <h1 className="text-2xl font-bold text-gray-800">{crecheName}</h1>
        <p className="text-sm text-gray-500 mt-1">{creche?.adresse || ""}</p>
        <p className="text-sm text-gray-500">{creche?.telephone || ""}</p>
      </div>

      {/* Title */}
      <div className="text-center">
        <h2 className="text-xl font-bold text-gray-800 uppercase tracking-wide">
          {t("docs.enrollmentCertificate")}
        </h2>
      </div>

      {/* Body */}
      <div className="space-y-3 text-sm text-gray-700 leading-relaxed">
        <p>
          {t("docs.enrollmentBody1", {
            name: `${child.prenom} ${child.nom}`,
            dob: child.dateNaissance,
            creche: crecheName,
            date: child.dateInscription,
          })}
        </p>
        <p>{t("docs.enrollmentBody2")}</p>
      </div>

      {/* Child details */}
      <div className="border border-gray-200 rounded-md p-4 space-y-2 text-sm">
        <DocRow label={t("children.fullName")} value={`${child.prenom} ${child.nom}`} />
        <DocRow label={t("children.birthDate")} value={child.dateNaissance} />
        <DocRow label={t("children.parentName")} value={child.parentNom} />
        <DocRow label={t("children.parentPhone")} value={child.parentTelephone} />
        <DocRow label={t("children.enrollmentDate")} value={child.dateInscription} />
      </div>

      {/* Signature */}
      <div className="flex justify-between items-end pt-6">
        <div className="text-sm text-gray-500">
          <p>{t("docs.issuedOn", { date: today })}</p>
        </div>
        <div className="text-center text-sm text-gray-600">
          <p className="mb-10">{t("docs.managerSignature")}</p>
          <div className="border-t border-gray-400 w-40" />
        </div>
      </div>
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

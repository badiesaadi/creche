import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { mockClasses } from "../../../data/mockClasses.js";

const requiredDocuments = [
  { id: "acte_naissance", labelKey: "children.docBirthCert" },
  { id: "certificat_medical", labelKey: "children.docMedicalCert" },
  { id: "photo_identite", labelKey: "children.docPhoto" },
  { id: "fiche_vaccination", labelKey: "children.docVaccination" },
  { id: "attestation_residence", labelKey: "children.docResidence" },
];

export default function ChildEnrollmentPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    nom: "", prenom: "", dateNaissance: "", sexe: "M",
    parentNom: "", parentTelephone: "", parentEmail: "", adresse: "",
    allergies: "", notes: "", classeId: "", optionRepas: "libre",
  });
  const [documents, setDocuments] = useState(
    requiredDocuments.reduce((acc, doc) => ({ ...acc, [doc.id]: false }), {})
  );
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: null }));
  }

  function toggleDocument(id) {
    setDocuments((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  function validate() {
    const newErrors = {};
    if (!form.nom.trim()) newErrors.nom = t("common.required");
    if (!form.prenom.trim()) newErrors.prenom = t("common.required");
    if (!form.dateNaissance) newErrors.dateNaissance = t("common.required");
    if (!form.parentNom.trim()) newErrors.parentNom = t("common.required");
    if (!form.parentTelephone.trim()) newErrors.parentTelephone = t("common.required");
    return newErrors;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const newErrors = validate();
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }
    setSubmitting(true);
    // TODO: replace with real API call -> apiClient.post("/children", { ...form, documents })
    await new Promise((r) => setTimeout(r, 500));
    setSubmitting(false);
    navigate("/creche/enfants");
  }

  const allDocsChecked = Object.values(documents).every(Boolean);
  const docCount = Object.values(documents).filter(Boolean).length;

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-800">{t("children.addNew")}</h1>
        <button onClick={() => navigate("/creche/enfants")} className="text-sm text-gray-500 hover:text-gray-700">
          ← {t("common.cancel")}
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Child info */}
        <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 space-y-4">
          <h2 className="font-semibold text-gray-700">{t("children.childInfo")}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label={t("children.firstName")} name="prenom" value={form.prenom} onChange={handleChange} error={errors.prenom} />
            <Field label={t("children.lastName")} name="nom" value={form.nom} onChange={handleChange} error={errors.nom} />
            <Field label={t("children.birthDate")} name="dateNaissance" type="date" value={form.dateNaissance} onChange={handleChange} error={errors.dateNaissance} />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t("children.gender")}</label>
              <select name="sexe" value={form.sexe} onChange={handleChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500">
                <option value="M">{t("children.male")}</option>
                <option value="F">{t("children.female")}</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t("children.class")}</label>
              <select name="classeId" value={form.classeId} onChange={handleChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500">
                <option value="">— {t("children.noClass")} —</option>
                {mockClasses.map((c) => <option key={c.id} value={c.id}>{c.nom} ({c.tranche})</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t("children.lunchOption")}</label>
              <select name="optionRepas" value={form.optionRepas} onChange={handleChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500">
                <option value="creche">{t("children.lunchCreche")}</option>
                <option value="libre">{t("children.lunchLibre")}</option>
              </select>
            </div>
          </div>
          <Field label={t("children.allergies")} name="allergies" value={form.allergies} onChange={handleChange} placeholder={t("children.allergiesPlaceholder")} />
        </section>

        {/* Parent info */}
        <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 space-y-4">
          <h2 className="font-semibold text-gray-700">{t("children.parentInfo")}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label={t("children.parentName")} name="parentNom" value={form.parentNom} onChange={handleChange} error={errors.parentNom} />
            <Field label={t("children.parentPhone")} name="parentTelephone" value={form.parentTelephone} onChange={handleChange} error={errors.parentTelephone} />
            <Field label={t("children.parentEmail")} name="parentEmail" type="email" value={form.parentEmail} onChange={handleChange} />
            <Field label={t("children.address")} name="adresse" value={form.adresse} onChange={handleChange} />
          </div>
        </section>

        {/* Document checklist */}
        <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-700">{t("children.documentChecklist")}</h2>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${allDocsChecked ? "bg-green-50 text-green-600" : "bg-gray-100 text-gray-500"}`}>
              {docCount}/{requiredDocuments.length}
            </span>
          </div>
          <div className="space-y-2">
            {requiredDocuments.map((doc) => (
              <label key={doc.id} className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-gray-50 cursor-pointer">
                <input type="checkbox" checked={documents[doc.id]} onChange={() => toggleDocument(doc.id)}
                  className="w-4 h-4 text-teal-600 rounded focus:ring-teal-500" />
                <span className="text-sm text-gray-700">{t(doc.labelKey)}</span>
              </label>
            ))}
          </div>
          {!allDocsChecked && (
            <p className="text-xs text-yellow-600 bg-yellow-50 rounded-md px-3 py-2">{t("children.docsIncompleteWarning")}</p>
          )}
        </section>

        {/* Notes */}
        <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 space-y-2">
          <label className="block text-sm font-medium text-gray-700">{t("children.notes")}</label>
          <textarea name="notes" value={form.notes} onChange={handleChange} rows={3}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
        </section>

        <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
          <button type="button" onClick={() => navigate("/creche/enfants")}
            className="w-full sm:w-auto px-4 py-2 rounded-md border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50">
            {t("common.cancel")}
          </button>
          <button type="submit" disabled={submitting}
            className="w-full sm:w-auto px-4 py-2 rounded-md bg-teal-600 text-white text-sm font-medium hover:bg-teal-700 disabled:opacity-50">
            {submitting ? t("common.loading") : t("common.save")}
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, name, value, onChange, type = "text", error, placeholder }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input type={type} name={name} value={value} onChange={onChange} placeholder={placeholder}
        className={`w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 ${error ? "border-red-400" : "border-gray-300"}`} />
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}

import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../../lib/auth/AuthContext.jsx";
import { fetchCreche, updateCreche } from "../../../lib/api/creches.js";
import { fetchSettings, updateSettings } from "../../../lib/api/settings.js";
import { uploadDocument } from "../../../lib/api/documents.js";

const absenceTypes = ["Maladie", "Familiale", "Sans motif", "Médical", "Autre"];

export default function SettingsPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const isManager = user?.role === "manager";

  const [form, setForm] = useState({
    nom: "", telephone: "", adresse: "", logoUrl: "",
    fraisMensuel: 0, fraisInscription: 0, seuilGroupe: 0, seuilAbsence: 12, joursRappelPaiement: 7,
    typeEvaluation: "trimestre",
  });
  // These two features have no backing endpoint on the real backend yet —
  // kept as local-only UI so nothing is lost, but changes here aren't persisted.
  const [criteria, setCriteria] = useState([]);
  const [newCriterion, setNewCriterion] = useState("");
  const [enabledAbsenceTypes, setEnabledAbsenceTypes] = useState(absenceTypes);

  const [logoPreview, setLogoPreview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!user?.crecheId) {
      setLoading(false);
      return;
    }
    Promise.all([fetchCreche(user.crecheId), fetchSettings()])
      .then(([creche, settings]) => {
        setForm((prev) => ({
          ...prev,
          nom: creche.nom || "",
          telephone: creche.telephone || "",
          adresse: creche.adresse || "",
          logoUrl: creche.logoUrl || "",
          fraisMensuel: settings.fraisMensuel || 0,
          fraisInscription: settings.fraisInscription || 0,
          seuilGroupe: settings.seuilGroupe || 0,
          seuilAbsence: settings.seuilAbsence || 12,
          joursRappelPaiement: settings.joursRappelPaiement || 7,
          typeEvaluation: settings.typeEvaluation || "trimestre",
        }));
        setLogoPreview(creche.logoUrl || null);
      })
      .catch((err) => setError(err.response?.data?.message || t("common.error")))
      .finally(() => setLoading(false));
  }, [user?.crecheId, t]);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: ["fraisMensuel", "fraisInscription", "seuilGroupe", "seuilAbsence", "joursRappelPaiement"].includes(name) ? Number(value) : value,
    }));
    setSaved(false);
  }

  async function handleLogoChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setLogoPreview(ev.target.result);
    reader.readAsDataURL(file);
    setSaved(false);
    try {
      const uploaded = await uploadDocument("creches", file);
      const url = uploaded?.url || uploaded?.pdfUrl || uploaded?.link;
      if (url) setForm((prev) => ({ ...prev, logoUrl: url }));
    } catch {
      // upload failed — keep the local preview only, logoUrl stays unchanged
    }
  }

  function toggleAbsenceType(type) {
    setEnabledAbsenceTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
    setSaved(false);
  }

  function handleAddCriterion() {
    if (!newCriterion.trim()) return;
    setCriteria((prev) => [...prev, newCriterion.trim()]);
    setNewCriterion("");
    setSaved(false);
  }

  function handleRemoveCriterion(index) {
    setCriteria((prev) => prev.filter((_, i) => i !== index));
    setSaved(false);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const calls = [updateSettings(form)];
      if (user?.crecheId) calls.push(updateCreche(user.crecheId, form));
      await Promise.all(calls);
      setSaved(true);
    } catch (err) {
      setError(err.response?.data?.message || t("common.error"));
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <p className="text-gray-400 text-sm">{t("common.loading")}</p>;
  }

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-xl font-bold text-gray-800">{t("nav.settings")}</h1>
      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-2">{error}</p>}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Crèche info + logo */}
        <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 space-y-4">
          <h2 className="font-semibold text-gray-700">{t("settings.crecheInfo")}</h2>

          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-xl border border-gray-200 bg-gray-50 flex items-center justify-center overflow-hidden">
              {logoPreview ? <img src={logoPreview} alt="logo" className="w-full h-full object-cover" /> : <span className="text-2xl text-gray-400">PAI</span>}
            </div>
            {isManager && (
              <label className="cursor-pointer text-sm text-teal-600 hover:underline">
                {t("settings.uploadLogo")}
                <input type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
              </label>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label={t("settings.name")} name="nom" value={form.nom} onChange={handleChange} disabled={!isManager} />
            <Field label={t("settings.phone")} name="telephone" value={form.telephone} onChange={handleChange} disabled={!isManager} />
            <Field label={t("settings.address")} name="adresse" value={form.adresse} onChange={handleChange} disabled={!isManager} />
          </div>
        </section>

        {/* Tariffs */}
        <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 space-y-4">
          <h2 className="font-semibold text-gray-700">{t("settings.tariffs")}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label={`${t("settings.monthlyFee")} (DZD)`} name="fraisMensuel" type="number" value={form.fraisMensuel} onChange={handleChange} disabled={!isManager} />
            <Field label={`${t("settings.registrationFee")} (DZD)`} name="fraisInscription" type="number" value={form.fraisInscription} onChange={handleChange} disabled={!isManager} />
          </div>
        </section>

        {/* Group threshold */}
        <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 space-y-3">
          <h2 className="font-semibold text-gray-700">{t("settings.groupThreshold")}</h2>
          <Field label={t("settings.maxChildrenPerGroup")} name="seuilGroupe" type="number" value={form.seuilGroupe} onChange={handleChange} disabled={!isManager} />
          <p className="text-xs text-gray-400">{t("settings.thresholdHint")}</p>
        </section>

        {/* Absence threshold (triggers ABSENCE_THRESHOLD notification on the backend) */}
        <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 space-y-3">
          <h2 className="font-semibold text-gray-700">{t("settings.absenceThreshold")}</h2>
          <Field label={t("settings.absenceThresholdDays")} name="seuilAbsence" type="number" value={form.seuilAbsence} onChange={handleChange} disabled={!isManager} />
        </section>

        {/* Payment reminder delay */}
        <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 space-y-3">
          <h2 className="font-semibold text-gray-700">{t("settings.reminderDelay")}</h2>
          <Field label={t("settings.reminderDelayDays")} name="joursRappelPaiement" type="number" value={form.joursRappelPaiement || 7} onChange={handleChange} disabled={!isManager} />
          <p className="text-xs text-gray-400">{t("settings.reminderDelayHint")}</p>
        </section>

        {/* Evaluation period type */}
        <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 space-y-3">
          <h2 className="font-semibold text-gray-700">{t("settings.evalCriteria")}</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t("settings.evalCriteria")}</label>
            <select name="typeEvaluation" value={form.typeEvaluation} onChange={handleChange} disabled={!isManager}
              className={`w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 ${!isManager ? "bg-gray-50 text-gray-500" : ""}`}>
              <option value="trimestre">Trimestre</option>
              <option value="semestre">Semestre</option>
            </select>
          </div>

          {/* Free-form criteria list — not yet backed by a real endpoint,
              kept local so nothing already built is lost. */}
          <div className="space-y-2 pt-2 border-t border-gray-100">
            {criteria.map((c, i) => (
              <div key={i} className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-md">
                <span className="text-sm text-gray-700">{c}</span>
                {isManager && (
                  <button type="button" onClick={() => handleRemoveCriterion(i)} className="text-xs text-red-500 hover:underline">{t("common.delete")}</button>
                )}
              </div>
            ))}
          </div>
          {isManager && (
            <div className="flex flex-col sm:flex-row gap-2">
              <input type="text" value={newCriterion} onChange={(e) => setNewCriterion(e.target.value)}
                placeholder={t("settings.newCriterion")} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddCriterion())}
                className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
              <button type="button" onClick={handleAddCriterion}
                className="w-full sm:w-auto px-4 py-2 rounded-md border border-teal-600 text-teal-600 text-sm font-medium hover:bg-teal-50">
                + {t("common.save")}
              </button>
            </div>
          )}
        </section>

        {/* Absence types — not yet backed by a real endpoint, kept local */}
        <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 space-y-3">
          <h2 className="font-semibold text-gray-700">{t("settings.absenceTypes")}</h2>
          <div className="space-y-2">
            {absenceTypes.map((type) => (
              <label key={type} className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-gray-50 cursor-pointer">
                <input type="checkbox" checked={enabledAbsenceTypes.includes(type)} onChange={() => toggleAbsenceType(type)} disabled={!isManager}
                  className="w-4 h-4 text-teal-600 rounded focus:ring-teal-500" />
                <span className="text-sm text-gray-700">{type}</span>
              </label>
            ))}
          </div>
        </section>

        {isManager && (
          <div className="flex flex-col sm:flex-row items-center gap-3 sm:justify-end">
            {saved && <span className="text-sm text-green-600">{t("settings.savedSuccess")}</span>}
            <button type="submit" disabled={submitting}
              className="w-full sm:w-auto px-6 py-2 rounded-md bg-teal-600 text-white text-sm font-medium hover:bg-teal-700 disabled:opacity-50">
              {submitting ? t("common.loading") : t("common.save")}
            </button>
          </div>
        )}
      </form>
    </div>
  );
}

function Field({ label, name, value, onChange, type = "text", disabled }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input type={type} name={name} value={value} onChange={onChange} disabled={disabled}
        className={`w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 ${disabled ? "bg-gray-50 text-gray-500 cursor-not-allowed" : ""}`} />
    </div>
  );
}

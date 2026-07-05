import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { mockClasses } from "../../../data/mockClasses.js";

export default function ClassFormPage() {
  const { id } = useParams(); // undefined = create mode
  const navigate = useNavigate();
  const { t } = useTranslation();
  const isEdit = Boolean(id);

  const existing = isEdit ? mockClasses.find((c) => String(c.id) === id) : null;

  const [form, setForm] = useState({
    nom: existing?.nom || "",
    tranche: existing?.tranche || "",
    enseignant: existing?.enseignant || "",
    seuilMax: existing?.seuilMax || 15,
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: name === "seuilMax" ? Number(value) : value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: null }));
  }

  function validate() {
    const newErrors = {};
    if (!form.nom.trim()) newErrors.nom = t("common.required");
    if (!form.tranche.trim()) newErrors.tranche = t("common.required");
    if (!form.enseignant.trim()) newErrors.enseignant = t("common.required");
    if (!form.seuilMax || form.seuilMax < 1) newErrors.seuilMax = t("classes.invalidThreshold");
    return newErrors;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const newErrors = validate();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setSubmitting(true);

    // TODO: replace with real API call:
    // isEdit ? apiClient.put(`/classes/${id}`, form) : apiClient.post("/classes", form)
    await new Promise((r) => setTimeout(r, 500));
    console.log(isEdit ? "Class updated (mock):" : "Class created (mock):", form);

    setSubmitting(false);
    navigate("/creche/classes");
  }

  return (
    <div className="max-w-xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-800">
          {isEdit ? t("classes.editClass") : t("classes.addNew")}
        </h1>
        <button onClick={() => navigate("/creche/classes")} className="text-sm text-gray-500 hover:text-gray-700">
          ← {t("common.cancel")}
        </button>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 space-y-4">
        <Field label={t("classes.className")} name="nom" value={form.nom} onChange={handleChange} error={errors.nom} />
        <Field
          label={t("classes.ageRange")}
          name="tranche"
          value={form.tranche}
          onChange={handleChange}
          error={errors.tranche}
          placeholder="Ex: 2-3 ans"
        />
        <Field label={t("classes.teacher")} name="enseignant" value={form.enseignant} onChange={handleChange} error={errors.enseignant} />
        <Field
          label={t("classes.threshold")}
          name="seuilMax"
          type="number"
          value={form.seuilMax}
          onChange={handleChange}
          error={errors.seuilMax}
        />

        <div className="flex flex-col sm:flex-row gap-3 sm:justify-end pt-2">
          <button
            type="button"
            onClick={() => navigate("/creche/classes")}
            className="w-full sm:w-auto px-4 py-2 rounded-md border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50"
          >
            {t("common.cancel")}
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="w-full sm:w-auto px-4 py-2 rounded-md bg-teal-600 text-white text-sm font-medium hover:bg-teal-700 disabled:opacity-50"
          >
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
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 ${
          error ? "border-red-400" : "border-gray-300"
        }`}
      />
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}
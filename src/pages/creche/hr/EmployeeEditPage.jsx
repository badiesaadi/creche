import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { fetchEmployee, updateEmployee } from "../../../lib/api/employees.js";

// PATCH /employees/{id} only accepts name/phone/email/specialty — salary,
// contract type, and dates can't be changed here (use "Add contract" for that).
export default function EmployeeEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [form, setForm] = useState({ nom: "", telephone: "", email: "", specialite: "" });
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    fetchEmployee(id)
      .then((emp) => {
        setForm({
          nom: emp.nom || "",
          telephone: emp.telephone || "",
          email: emp.email || "",
          specialite: emp.specialite || "",
        });
      })
      .catch((err) => setSubmitError(err.response?.data?.message || t("common.error")))
      .finally(() => setLoading(false));
  }, [id, t]);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: null }));
  }

  function validate() {
    const newErrors = {};
    if (!form.nom.trim()) newErrors.nom = t("common.required");
    if (!form.telephone.trim()) newErrors.telephone = t("common.required");
    return newErrors;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const newErrors = validate();
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }
    setSubmitting(true);
    setSubmitError("");
    try {
      await updateEmployee(id, form);
      navigate(`/creche/hr/${id}`);
    } catch (err) {
      setSubmitError(err.response?.data?.message || t("common.error"));
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <p className="text-gray-400 text-sm">{t("common.loading")}</p>;
  }

  return (
    <div className="max-w-xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-800">{t("hr.editEmployee")}</h1>
        <button onClick={() => navigate(`/creche/hr/${id}`)} className="text-sm text-gray-500 hover:text-gray-700">
          ← {t("common.cancel")}
        </button>
      </div>

      <p className="text-xs text-yellow-700 bg-yellow-50 border border-yellow-200 rounded-md px-3 py-2">
        {t("hr.editLimitedHint")}
      </p>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 space-y-4">
        <Field label={t("hr.name")} name="nom" value={form.nom} onChange={handleChange} error={errors.nom} />
        <Field label={t("hr.phone")} name="telephone" value={form.telephone} onChange={handleChange} error={errors.telephone} />
        <Field label={t("hr.email")} name="email" type="email" value={form.email} onChange={handleChange} />
        <Field label={t("hr.specialty")} name="specialite" value={form.specialite} onChange={handleChange} />

        {submitError && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-2">{submitError}</p>}

        <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
          <button type="button" onClick={() => navigate(`/creche/hr/${id}`)}
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

function Field({ label, name, value, onChange, type = "text", error }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input type={type} name={name} value={value} onChange={onChange}
        className={`w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 ${error ? "border-red-400" : "border-gray-300"}`} />
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { fetchClasses } from "../../../lib/api/classes.js";
import { createEmployee, assignEmployeeGroup } from "../../../lib/api/employees.js";

export default function AddEmployeePage() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [form, setForm] = useState({
    nom: "",
    poste: "",
    telephone: "",
    email: "",
    password: "",
    dateEmbauche: new Date().toISOString().slice(0, 10),
    salaireBase: "",
    contractType: "CDI",
    contractDateDebut: new Date().toISOString().slice(0, 10),
    contractDateFin: "",
    classeId: "",  // REQ-013: teacher-to-group assignment (holds a real group uuid)
  });
  const [classes, setClasses] = useState([]);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    fetchClasses().then(setClasses).catch(() => setClasses([]));
  }, []);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: null }));
  }

  function validate() {
    const newErrors = {};
    if (!form.nom.trim()) newErrors.nom = t("common.required");
    if (!form.poste.trim()) newErrors.poste = t("common.required");
    if (!form.telephone.trim()) newErrors.telephone = t("common.required");
    if (!form.password || form.password.length < 6) newErrors.password = t("common.required");
    if (!form.salaireBase || Number(form.salaireBase) <= 0) newErrors.salaireBase = t("common.required");
    if (!form.contractDateDebut) newErrors.contractDateDebut = t("common.required");
    if (form.contractType === "CDD" && !form.contractDateFin) newErrors.contractDateFin = t("common.required");
    return newErrors;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const newErrors = validate();
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }
    setSubmitting(true);
    setSubmitError("");
    try {
      const newEmployee = await createEmployee({
        nom: form.nom,
        telephone: form.telephone,
        email: form.email,
        password: form.password,
        specialite: form.poste,
        poste: form.poste,
        contratType: form.contractType,
        salaire: form.salaireBase,
        dateDebut: form.contractDateDebut,
        dateFin: form.contractDateFin,
      });
      if (isTeacher && form.classeId) {
        await assignEmployeeGroup(newEmployee.id, form.classeId).catch(() => {});
      }
      navigate("/creche/hr");
    } catch (err) {
      setSubmitError(err.response?.data?.message || t("common.error"));
    } finally {
      setSubmitting(false);
    }
  }

  const isTeacher = form.poste.toLowerCase().includes("enseignant") || form.poste === "Enseignante" || form.poste === "Enseignant";

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-800">{t("hr.addEmployee")}</h1>
        <button onClick={() => navigate("/creche/hr")} className="text-sm text-gray-500 hover:text-gray-700">
          ← {t("common.cancel")}
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Personal info */}
        <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 space-y-4">
          <h2 className="font-semibold text-gray-700">{t("hr.personalInfo")}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label={t("hr.name")} name="nom" value={form.nom} onChange={handleChange} error={errors.nom} />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t("hr.position")}</label>
              <select name="poste" value={form.poste} onChange={handleChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500">
                <option value="">— {t("hr.selectPosition")} —</option>
                <option value="Enseignante">Enseignante</option>
                <option value="Enseignant">Enseignant</option>
                <option value="Assistante">Assistante</option>
                <option value="Manager">Manager</option>
                <option value="Cuisinière">Cuisinière</option>
                <option value="Agent d'entretien">Agent d'entretien</option>
              </select>
            </div>
            <Field label={t("hr.phone")} name="telephone" value={form.telephone} onChange={handleChange} error={errors.telephone} />
            <Field label={t("hr.email")} name="email" type="email" value={form.email} onChange={handleChange} />
            <Field label={t("auth.password") || "Password"} name="password" type="password" value={form.password} onChange={handleChange} error={errors.password} />
            <Field label={t("hr.hireDate")} name="dateEmbauche" type="date" value={form.dateEmbauche} onChange={handleChange} />
            <Field label={`${t("hr.baseSalary")} (DZD)`} name="salaireBase" type="number" value={form.salaireBase} onChange={handleChange} error={errors.salaireBase} />
          </div>

          {/* REQ-013: Class assignment — only shown when position is teacher */}
          {isTeacher && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t("hr.assignedClass")}</label>
              <select name="classeId" value={form.classeId} onChange={handleChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500">
                <option value="">— {t("hr.noClassAssigned")} —</option>
                {classes.flatMap((c) =>
                  (c.groups || []).map((g) => (
                    <option key={g.id} value={g.id}>{c.nom} ({c.tranche}) — {g.nom}</option>
                  ))
                )}
              </select>
              <p className="text-xs text-gray-400 mt-1">{t("hr.classAssignmentHint")}</p>
            </div>
          )}
        </section>

        {/* Contract */}
        <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 space-y-4">
          <h2 className="font-semibold text-gray-700">{t("hr.tabContract")}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t("hr.contractType")}</label>
              <select name="contractType" value={form.contractType} onChange={handleChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500">
                <option value="CDI">CDI</option>
                <option value="CDD">CDD</option>
              </select>
            </div>
            <Field label={t("hr.startDate")} name="contractDateDebut" type="date" value={form.contractDateDebut} onChange={handleChange} error={errors.contractDateDebut} />
            {form.contractType === "CDD" && (
              <Field label={t("hr.endDate")} name="contractDateFin" type="date" value={form.contractDateFin} onChange={handleChange} error={errors.contractDateFin} />
            )}
          </div>
          {form.contractType === "CDD" && (
            <p className="text-xs text-yellow-600 bg-yellow-50 rounded-md px-3 py-2">{t("hr.cddWarning")}</p>
          )}
        </section>

        {submitError && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-2">{submitError}</p>}

        <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
          <button type="button" onClick={() => navigate("/creche/hr")}
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

import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { fetchGroup, fetchClass, createClass, updateClass, createGroup, updateGroup, assignGroupTeacher } from "../../../lib/api/classes.js";
import { fetchEmployees } from "../../../lib/api/employees.js";

// Note: the URL's :id is a Group id (groups hold children + a teacher on the
// real backend, while a "Class" is just the shared age bracket). Creating a
// new entry here creates a Class *and* its first Group together, since a
// bare class can't hold children on its own.
export default function ClassFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const isEdit = Boolean(id);

  const [form, setForm] = useState({
    nom: "", tranche: "", enseignant: "", enseignantId: "", seuilMax: 15,
  });
  const [classId, setClassId] = useState(null);
  const [className, setClassName] = useState("");
  const [ageRange, setAgeRange] = useState("");
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(isEdit);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    fetchEmployees().then(setTeachers).catch(() => setTeachers([]));
  }, []);

  useEffect(() => {
    if (!isEdit) return;
    fetchGroup(id)
      .then(async (g) => {
        setForm({
          nom: g.nom || "",
          tranche: "",
          enseignant: g.enseignant || "",
          enseignantId: "",
          seuilMax: g.seuilMax || 15,
        });
        setClassId(g.classId || null);
        if (g.classId) {
          const cls = await fetchClass(g.classId).catch(() => null);
          if (cls) {
            setClassName(cls.nom || "");
            setAgeRange(cls.tranche?.replace(/\s*ans$/, "") || "");
          }
        }
      })
      .catch(() => setErrors({ nom: t("common.error") }))
      .finally(() => setLoading(false));
  }, [id, isEdit, t]);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: name === "seuilMax" ? Number(value) : value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: null }));
  }

  function validate() {
    const newErrors = {};
    if (!form.nom.trim()) newErrors.nom = t("common.required");
    if (!isEdit && !form.tranche.trim()) newErrors.tranche = t("common.required");
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
    setSubmitError("");
    try {
      if (isEdit) {
        if (classId) {
          await updateClass(classId, { name: className, maxCapacity: form.seuilMax });
        }
        await updateGroup(id, form);
        if (form.enseignantId) {
          await assignGroupTeacher(id, form.enseignantId).catch(() => {});
        }
      } else {
        const [minAge, maxAge] = form.tranche.split("-").map((s) => parseInt(s, 10) || 0);
        const newClass = await createClass({
          nom: form.nom,
          minAge: minAge || 0,
          maxAge: maxAge || minAge || 0,
          seuilMax: form.seuilMax,
        });
        const newGroup = await createGroup({ name: `${form.nom} A`, maxCapacity: form.seuilMax }, newClass.id);
        if (form.enseignantId) {
          await assignGroupTeacher(newGroup.id, form.enseignantId).catch(() => {});
        }
      }
      navigate("/creche/classes");
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
        <h1 className="text-xl font-bold text-gray-800">
          {isEdit ? t("classes.editClass") : t("classes.addNew")}
        </h1>
        <button onClick={() => navigate("/creche/classes")} className="text-sm text-gray-500 hover:text-gray-700">
          ← {t("common.cancel")}
        </button>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 space-y-4">
        {isEdit && (
          <Field
            label={t("classes.className")}
            name="className"
            value={className}
            onChange={(e) => setClassName(e.target.value)}
          />
        )}
        <Field label={isEdit ? t("classes.groupName") : t("classes.className")} name="nom" value={form.nom} onChange={handleChange} error={errors.nom} />
        {!isEdit && (
          <Field
            label={t("classes.ageRange")}
            name="tranche"
            value={form.tranche}
            onChange={handleChange}
            error={errors.tranche}
            placeholder="Ex: 2-3"
          />
        )}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t("classes.teacher")}</label>
          <select name="enseignantId" value={form.enseignantId} onChange={handleChange}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500">
            <option value="">{form.enseignant || `— ${t("classes.teacher")} —`}</option>
            {teachers.map((tch) => <option key={tch.id} value={tch.id}>{tch.nom}</option>)}
          </select>
        </div>
        <Field
          label={t("classes.threshold")}
          name="seuilMax"
          type="number"
          value={form.seuilMax}
          onChange={handleChange}
          error={errors.seuilMax}
        />

        {submitError && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-2">{submitError}</p>}

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

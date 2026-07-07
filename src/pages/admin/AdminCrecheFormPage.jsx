import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { fetchCreche, createCreche, updateCreche } from "../../lib/api/creches.js";
import { fetchEmployees } from "../../lib/api/employees.js";
import { apiClient } from "../../lib/api/client.js";

// REQ-020 — Gestion du réseau d'établissements :
// L'administrateur peut créer une nouvelle crèche OU modifier une crèche
// existante (nom, adresse, logo, responsable assigné, capacité).
//
// Backend contract (see Creche_Backend_API_openapi.json):
//   POST /creches   requires { name, address, phone, responsable: {name,email,password,phone} }
//   PATCH /creches/:id  updates name/address/phone/logo only
//   POST/PATCH /creches/:id/assign-responsable { userId }  reassigns an EXISTING manager
export default function AdminCrecheFormPage() {
  const { id } = useParams(); // undefined = create mode
  const navigate = useNavigate();
  const { t } = useTranslation();
  const isEdit = Boolean(id);

  const [loading, setLoading] = useState(isEdit);
  const [notFound, setNotFound] = useState(false);
  const [managers, setManagers] = useState([]);

  const [form, setForm] = useState({
    nom: "",
    adresse: "",
    telephone: "",
    logoUrl: "",
    capacite: "",
    tarifMensuel: "",
    managerId: "", // edit mode: reassign an existing manager
    responsable: { nom: "", email: "", password: "", telephone: "" }, // create mode only
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState("");

  useEffect(() => {
    fetchEmployees()
      .then((all) => setManagers(all.filter((e) => e.poste === "Manager")))
      .catch(() => {});

    if (!isEdit) return;
    fetchCreche(id)
      .then((creche) => {
        setForm((prev) => ({
          ...prev,
          nom: creche.nom,
          adresse: creche.adresse,
          telephone: creche.telephone,
          logoUrl: creche.logoUrl,
          capacite: creche.capacite,
          tarifMensuel: creche.tarifMensuel,
          managerId: creche.managerId ? String(creche.managerId) : "",
        }));
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id, isEdit]);

  if (loading) {
    return <p className="text-gray-400 text-sm py-8 text-center">{t("common.loading")}</p>;
  }

  if (isEdit && notFound) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">{t("admin.crecheNotFound")}</p>
        <button onClick={() => navigate("/admin/creches")} className="mt-3 text-teal-600 hover:underline text-sm">
          ← {t("common.cancel")}
        </button>
      </div>
    );
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: ["capacite", "tarifMensuel"].includes(name) ? value.replace(/[^0-9]/g, "") : value,
    }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: null }));
  }

  function handleResponsableChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, responsable: { ...prev.responsable, [name]: value } }));
    if (errors[`responsable.${name}`]) setErrors((prev) => ({ ...prev, [`responsable.${name}`]: null }));
  }

  function validate() {
    const newErrors = {};
    if (!form.nom.trim()) newErrors.nom = t("common.required");
    if (!form.adresse.trim()) newErrors.adresse = t("common.required");
    if (!form.telephone.trim()) newErrors.telephone = t("common.required");
    if (!form.capacite || Number(form.capacite) < 1) newErrors.capacite = t("admin.invalidCapacity");
    if (!isEdit) {
      if (!form.responsable.nom.trim()) newErrors["responsable.nom"] = t("common.required");
      if (!form.responsable.email.trim()) newErrors["responsable.email"] = t("common.required");
      if (!form.responsable.password.trim()) newErrors["responsable.password"] = t("common.required");
      if (!form.responsable.telephone.trim()) newErrors["responsable.telephone"] = t("common.required");
    }
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
    setApiError("");

    try {
      if (isEdit) {
        const updated = await updateCreche(id, form);
        // Reassign the manager separately — the backend only accepts an
        // existing userId here, not a brand-new account (see docstring above).
        if (form.managerId) {
          await apiClient.post(`/creches/${id}/assign-responsable`, { userId: form.managerId });
        }
        navigate(`/admin/creches/${updated.id}`);
      } else {
        const created = await createCreche(form);
        navigate(`/admin/creches/${created.id}`);
      }
    } catch (err) {
      setApiError(err.response?.data?.message || t("common.error"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-800">
          {isEdit ? t("admin.editCreche") : t("admin.newCreche")}
        </h1>
        <button onClick={() => navigate(isEdit ? `/admin/creches/${id}` : "/admin/creches")} className="text-sm text-gray-500 hover:text-gray-700">
          ← {t("common.cancel")}
        </button>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 space-y-4">
        {apiError && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-2">{apiError}</p>}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label={t("admin.crecheName")} name="nom" value={form.nom} onChange={handleChange} error={errors.nom} />
          <Field label={t("hr.phone")} name="telephone" value={form.telephone} onChange={handleChange} error={errors.telephone} />
        </div>

        <Field label={t("admin.address")} name="adresse" value={form.adresse} onChange={handleChange} error={errors.adresse} />

        <Field
          label={t("admin.logoUrl")}
          name="logoUrl"
          value={form.logoUrl}
          onChange={handleChange}
          placeholder="https://..."
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field
            label={t("admin.capacity")}
            name="capacite"
            type="number"
            value={form.capacite}
            onChange={handleChange}
            error={errors.capacite}
          />
          <Field
            label={`${t("settings.monthlyFee")} (DZD)`}
            name="tarifMensuel"
            type="number"
            value={form.tarifMensuel}
            onChange={handleChange}
          />
        </div>

        {isEdit ? (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t("admin.manager")}</label>
            <select
              name="managerId"
              value={form.managerId}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="">— {t("admin.selectManager")} —</option>
              {managers.map((m) => (
                <option key={m.id} value={m.id}>{m.nom}</option>
              ))}
            </select>
            <p className="text-xs text-gray-400 mt-1">{t("admin.unassigned")}</p>
          </div>
        ) : (
          <div className="border-t border-gray-100 pt-4 space-y-3">
            <p className="text-sm font-medium text-gray-700">{t("admin.manager")} ({t("admin.newCreche")})</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label={t("admin.crecheName")} name="nom" value={form.responsable.nom} onChange={handleResponsableChange} error={errors["responsable.nom"]} />
              <Field label={t("hr.phone")} name="telephone" value={form.responsable.telephone} onChange={handleResponsableChange} error={errors["responsable.telephone"]} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label={t("hr.email")} name="email" type="email" value={form.responsable.email} onChange={handleResponsableChange} error={errors["responsable.email"]} />
              <Field label={t("auth.password")} name="password" type="password" value={form.responsable.password} onChange={handleResponsableChange} error={errors["responsable.password"]} />
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 sm:justify-end pt-2">
          <button
            type="button"
            onClick={() => navigate(isEdit ? `/admin/creches/${id}` : "/admin/creches")}
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

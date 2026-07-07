import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { fetchCharges, addCharge } from "../../lib/api/admin.js";
import { fetchCreches } from "../../lib/api/creches.js";

const categories = ["Loyer", "Eau/Électricité", "Fournitures", "Maintenance", "Salaires", "Alimentation", "Autre"];
const modes = ["Espèces", "CIB", "Chèque"];

export default function AdminExpensesPage() {
  const { t } = useTranslation();
  const [expenses, setExpenses] = useState([]);
  const [creches, setCreches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [crecheFilter, setCrecheFilter] = useState("toutes");
  const [typeFilter, setTypeFilter] = useState("tous");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    crecheId: "", categorie: "", montant: "", date: new Date().toISOString().slice(0, 10),
    type: "ponctuelle", frequence: "mensuelle", mode: "Espèces", reference: "",
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchCreches()
      .then(async (crechesList) => {
        setCreches(crechesList);
        const nameById = Object.fromEntries(crechesList.map((c) => [c.id, c.nom]));
        const charges = await fetchCharges({ crecheNameById: nameById });
        setExpenses(charges);
      })
      .catch((err) => setError(err.response?.data?.message || t("common.error")))
      .finally(() => setLoading(false));
  }, [t]);

  const filtered = expenses.filter((e) => {
    const matchCreche = crecheFilter === "toutes" || String(e.crecheId) === crecheFilter;
    const matchType = typeFilter === "tous" || e.type === typeFilter;
    return matchCreche && matchType;
  });
  const total = filtered.reduce((sum, e) => sum + (e.montant || 0), 0);

  function handleChange(ev) {
    const { name, value } = ev.target;
    setForm((p) => ({ ...p, [name]: value }));
    if (errors[name]) setErrors((p) => ({ ...p, [name]: null }));
  }

  function validate() {
    const errs = {};
    if (!form.crecheId) errs.crecheId = t("common.required");
    if (!form.categorie) errs.categorie = t("common.required");
    if (!form.montant || Number(form.montant) <= 0) errs.montant = t("common.required");
    if (!form.date) errs.date = t("common.required");
    return errs;
  }

  async function handleSubmit(ev) {
    ev.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setSubmitting(true);
    try {
      const creche = creches.find((c) => String(c.id) === form.crecheId);
      const newExpense = await addCharge(form);
      setExpenses((p) => [{ ...newExpense, creche: creche?.nom || "" }, ...p]);
      setForm({ crecheId: "", categorie: "", montant: "", date: new Date().toISOString().slice(0, 10), type: "ponctuelle", frequence: "mensuelle", mode: "Espèces", reference: "" });
      setShowForm(false);
    } catch (err) {
      setError(err.response?.data?.message || t("common.error"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className="text-xl font-bold text-gray-800">{t("admin.expenses")}</h1>
        <button onClick={() => setShowForm((p) => !p)}
          className="w-full sm:w-auto px-4 py-2 rounded-md bg-teal-600 text-white text-sm font-medium hover:bg-teal-700">
          {showForm ? t("common.cancel") : `+ ${t("admin.addExpense")}`}
        </button>
      </div>

      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-2">{error}</p>}
      {loading && <p className="text-gray-400 text-sm">{t("common.loading")}</p>}

      {/* Total */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 inline-block">
        <p className="text-xs text-gray-400 uppercase">{t("admin.totalExpenses")}</p>
        <p className="text-2xl font-bold text-red-500">{total.toLocaleString()} DZD</p>
      </div>

      {/* Add form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 space-y-4">
          <h2 className="font-semibold text-gray-700">{t("admin.addExpense")}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <SelectField label={t("admin.creche")} name="crecheId" value={form.crecheId} onChange={handleChange} error={errors.crecheId}>
              <option value="">— {t("admin.selectCreche")} —</option>
              {creches.map((c) => <option key={c.id} value={c.id}>{c.nom}</option>)}
            </SelectField>
            <SelectField label={t("admin.expenseCategory")} name="categorie" value={form.categorie} onChange={handleChange} error={errors.categorie}>
              <option value="">— {t("admin.selectCategory")} —</option>
              {categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </SelectField>
            <InputField label={`${t("children.amount")} (DZD)`} name="montant" type="number" value={form.montant} onChange={handleChange} error={errors.montant} />
            <InputField label={t("children.date")} name="date" type="date" value={form.date} onChange={handleChange} error={errors.date} />
            <SelectField label={t("admin.expenseType")} name="type" value={form.type} onChange={handleChange}>
              <option value="ponctuelle">{t("admin.oneTime")}</option>
              <option value="recurrente">{t("admin.recurring")}</option>
            </SelectField>
            {form.type === "recurrente" && (
              <SelectField label={t("admin.frequency")} name="frequence" value={form.frequence} onChange={handleChange}>
                <option value="mensuelle">{t("admin.monthly")}</option>
                <option value="trimestrielle">{t("admin.quarterly")}</option>
                <option value="annuelle">{t("admin.yearly")}</option>
              </SelectField>
            )}
            <SelectField label={t("children.method")} name="mode" value={form.mode} onChange={handleChange}>
              {modes.map((m) => <option key={m} value={m}>{m}</option>)}
            </SelectField>
            <InputField label={t("admin.reference")} name="reference" value={form.reference} onChange={handleChange} />
          </div>
          <div className="flex justify-end">
            <button type="submit" disabled={submitting} className="px-5 py-2 rounded-md bg-teal-600 text-white text-sm font-medium hover:bg-teal-700 disabled:opacity-50">
              {submitting ? t("common.loading") : t("common.save")}
            </button>
          </div>
        </form>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <select value={crecheFilter} onChange={(e) => setCrecheFilter(e.target.value)}
          className="w-full sm:w-48 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500">
          <option value="toutes">{t("admin.allCreches")}</option>
          {creches.map((c) => <option key={c.id} value={c.id}>{c.nom}</option>)}
        </select>
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}
          className="w-full sm:w-48 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500">
          <option value="tous">{t("admin.allTypes")}</option>
          <option value="ponctuelle">{t("admin.oneTime")}</option>
          <option value="recurrente">{t("admin.recurring")}</option>
        </select>
      </div>

      {/* Desktop table */}
      <div className="hidden md:block bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
            <tr>
              <th className="text-start px-4 py-3">{t("children.date")}</th>
              <th className="text-start px-4 py-3">{t("admin.creche")}</th>
              <th className="text-start px-4 py-3">{t("admin.expenseCategory")}</th>
              <th className="text-start px-4 py-3">{t("children.amount")}</th>
              <th className="text-start px-4 py-3">{t("admin.expenseType")}</th>
              <th className="text-start px-4 py-3">{t("children.method")}</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((e) => (
              <tr key={e.id} className="border-t border-gray-100 hover:bg-gray-50">
                <td className="px-4 py-3 text-gray-600">{e.date}</td>
                <td className="px-4 py-3 text-gray-700">{e.creche}</td>
                <td className="px-4 py-3 font-medium text-gray-800">{e.categorie}</td>
                <td className="px-4 py-3 text-red-600 font-medium">{(e.montant || 0).toLocaleString()} DZD</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${e.type === "recurrente" ? "bg-blue-50 text-blue-700" : "bg-gray-100 text-gray-500"}`}>
                    {e.type === "recurrente" ? t("admin.recurring") : t("admin.oneTime")}
                    {e.frequence ? ` · ${e.frequence}` : ""}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-600">{e.mode}</td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">{t("common.noResults")}</td></tr>}
          </tbody>
        </table>
      </div>

      {/* Mobile */}
      <div className="md:hidden space-y-3">
        {filtered.map((e) => (
          <div key={e.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-1">
              <span className="font-medium text-gray-800">{e.categorie}</span>
              <span className="font-semibold text-red-500">{(e.montant || 0).toLocaleString()} DZD</span>
            </div>
            <p className="text-xs text-gray-500">{e.creche} · {e.date} · {e.mode}</p>
          </div>
        ))}
        {filtered.length === 0 && <p className="text-center text-gray-400 py-8">{t("common.noResults")}</p>}
      </div>
    </div>
  );
}

function InputField({ label, name, type = "text", value, onChange, error }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input type={type} name={name} value={value} onChange={onChange}
        className={`w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 ${error ? "border-red-400" : "border-gray-300"}`} />
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}

function SelectField({ label, name, value, onChange, error, children }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <select name={name} value={value} onChange={onChange}
        className={`w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 ${error ? "border-red-400" : "border-gray-300"}`}>
        {children}
      </select>
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}

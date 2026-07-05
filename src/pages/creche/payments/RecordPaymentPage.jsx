import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { mockChildren } from "../../../data/mockChildren.js";

export default function RecordPaymentPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [form, setForm] = useState({
    childId: "",
    date: new Date().toISOString().slice(0, 10),
    montant: "",
    methode: "Espèces",
    discount: "",
    discountReason: "",
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: null }));
  }

  function validate() {
    const newErrors = {};
    if (!form.childId) newErrors.childId = t("common.required");
    if (!form.montant || Number(form.montant) <= 0) newErrors.montant = t("payments.invalidAmount");
    if (form.discount && !form.discountReason.trim()) {
      newErrors.discountReason = t("payments.discountReasonRequired");
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

    // TODO: replace with real API call -> apiClient.post("/payments", form)
    await new Promise((r) => setTimeout(r, 500));
    console.log("Payment recorded (mock):", form);

    setSubmitting(false);
    navigate("/creche/payments");
  }

  return (
    <div className="max-w-xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-800">{t("payments.recordPayment")}</h1>
        <button onClick={() => navigate("/creche/payments")} className="text-sm text-gray-500 hover:text-gray-700">
          ← {t("common.cancel")}
        </button>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t("children.fullName")}</label>
          <select
            name="childId"
            value={form.childId}
            onChange={handleChange}
            className={`w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 ${
              errors.childId ? "border-red-400" : "border-gray-300"
            }`}
          >
            <option value="">{t("payments.selectChild")}</option>
            {mockChildren.filter((c) => c.statut === "actif").map((c) => (
              <option key={c.id} value={c.id}>{c.prenom} {c.nom}</option>
            ))}
          </select>
          {errors.childId && <p className="text-xs text-red-500 mt-1">{errors.childId}</p>}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t("children.date")}</label>
            <input
              type="date"
              name="date"
              value={form.date}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t("children.amount")} (DZD)</label>
            <input
              type="number"
              name="montant"
              value={form.montant}
              onChange={handleChange}
              className={`w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                errors.montant ? "border-red-400" : "border-gray-300"
              }`}
            />
            {errors.montant && <p className="text-xs text-red-500 mt-1">{errors.montant}</p>}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t("children.method")}</label>
          <select
            name="methode"
            value={form.methode}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option value="Espèces">{t("payments.cash")}</option>
            <option value="Virement">{t("payments.transfer")}</option>
            <option value="Chèque">{t("payments.check")}</option>
          </select>
        </div>

        <div className="border-t border-gray-100 pt-4 space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t("payments.discount")} (DZD)</label>
            <input
              type="number"
              name="discount"
              value={form.discount}
              onChange={handleChange}
              placeholder="0"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          {form.discount && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t("payments.discountReason")}</label>
              <input
                type="text"
                name="discountReason"
                value={form.discountReason}
                onChange={handleChange}
                className={`w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                  errors.discountReason ? "border-red-400" : "border-gray-300"
                }`}
              />
              {errors.discountReason && <p className="text-xs text-red-500 mt-1">{errors.discountReason}</p>}
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 sm:justify-end pt-2">
          <button
            type="button"
            onClick={() => navigate("/creche/payments")}
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
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { fetchChild, withdrawChild } from "../../../lib/api/children.js";
import { useAuth } from "../../../lib/auth/AuthContext.jsx";

export default function ChildWithdrawalPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useAuth();

  const [child, setChild] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchChild(id)
      .then(setChild)
      .catch(() => setChild(null))
      .finally(() => setLoading(false));
  }, [id]);

  const [reason, setReason] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [confirmChecked, setConfirmChecked] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Manager-only guard at the page level (in addition to route-level role checks elsewhere)
  if (user?.role !== "manager") {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">{t("children.managerOnly")}</p>
        <button onClick={() => navigate(-1)} className="mt-3 text-teal-600 hover:underline text-sm">
          ← {t("common.cancel")}
        </button>
      </div>
    );
  }

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

  async function handleSubmit(e) {
    e.preventDefault();
    if (!reason.trim()) {
      setError(t("common.required"));
      return;
    }
    if (!confirmChecked) {
      setError(t("children.confirmWithdrawalRequired"));
      return;
    }
    setError("");
    setSubmitting(true);

    try {
      await withdrawChild(id, { date, reason });
      navigate("/creche/enfants");
    } catch (err) {
      setError(err.response?.data?.message || t("common.error"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-xl space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(`/creche/enfants/${id}`)} className="text-gray-400 hover:text-gray-600">
          ←
        </button>
        <h1 className="text-xl font-bold text-gray-800">
          {t("children.withdrawTitle", { name: `${child.prenom} ${child.nom}` })}
        </h1>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 text-sm rounded-md p-3">
        {t("children.withdrawalWarning")}
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t("children.withdrawalDate")}
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t("children.withdrawalReason")}
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>

        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={confirmChecked}
            onChange={(e) => setConfirmChecked(e.target.checked)}
            className="w-4 h-4 mt-0.5 text-red-600 rounded focus:ring-red-500"
          />
          <span className="text-sm text-gray-600">{t("children.confirmWithdrawalText")}</span>
        </label>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex flex-col sm:flex-row gap-3 sm:justify-end pt-2">
          <button
            type="button"
            onClick={() => navigate(`/creche/enfants/${id}`)}
            className="w-full sm:w-auto px-4 py-2 rounded-md border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50"
          >
            {t("common.cancel")}
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="w-full sm:w-auto px-4 py-2 rounded-md bg-red-600 text-white text-sm font-medium hover:bg-red-700 disabled:opacity-50"
          >
            {submitting ? t("common.loading") : t("children.confirmWithdraw")}
          </button>
        </div>
      </form>
    </div>
  );
}
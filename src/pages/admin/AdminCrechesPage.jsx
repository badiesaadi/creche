import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { mockCrecheNetwork } from "../../data/mockAdmin.js";

export default function AdminCrechesPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [creches, setCreches] = useState(mockCrecheNetwork);

  function toggleStatus(id) {
    setCreches((prev) =>
      prev.map((c) => c.id === id ? { ...c, statut: c.statut === "active" ? "inactive" : "active" } : c)
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className="text-xl font-bold text-gray-800">{t("nav.creches")}</h1>
        <button
          onClick={() => navigate("/admin/creches/nouveau")}
          className="bg-teal-600 text-white rounded-md px-4 py-2 text-sm font-medium hover:bg-teal-700 w-full sm:w-auto"
        >
          + {t("admin.addCreche")}
        </button>
      </div>

      <div className="space-y-3">
        {creches.map((c) => (
          <div key={c.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex-1 cursor-pointer" onClick={() => navigate(`/admin/creches/${c.id}`)}>
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium text-gray-800">{c.nom}</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${c.statut === "active" ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                  {c.statut === "active" ? t("admin.active") : t("admin.inactive")}
                </span>
              </div>
              <p className="text-sm text-gray-500">{c.adresse}</p>
              <p className="text-xs text-gray-400 mt-1">{t("admin.manager")}: {c.manager} · {c.enfantsCount} {t("admin.children")}</p>
            </div>
            <button
              onClick={() => toggleStatus(c.id)}
              className={`w-full sm:w-auto px-4 py-2 rounded-md text-sm font-medium border ${
                c.statut === "active" ? "border-red-300 text-red-600 hover:bg-red-50" : "border-green-300 text-green-600 hover:bg-green-50"
              }`}
            >
              {c.statut === "active" ? t("admin.deactivate") : t("admin.activate")}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
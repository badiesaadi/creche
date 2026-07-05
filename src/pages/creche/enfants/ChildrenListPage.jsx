import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { mockChildren } from "../../../data/mockChildren.js";

const statusStyles = {
  actif: "bg-green-50 text-green-700",
  en_attente: "bg-yellow-50 text-yellow-700",
  retire: "bg-gray-100 text-gray-500",
};

export default function ChildrenListPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  // TODO: replace with real API call -> apiClient.get("/children")
  const [children] = useState(mockChildren);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("tous");

  const filtered = children.filter((c) => {
    const fullName = `${c.prenom} ${c.nom}`.toLowerCase();
    const matchesSearch = fullName.includes(search.toLowerCase());
    const matchesStatus = statusFilter === "tous" || c.statut === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className="text-xl font-bold text-gray-800">{t("nav.children")}</h1>
        <button
          onClick={() => navigate("/creche/enfants/nouveau")}
          className="bg-teal-600 text-white rounded-md px-4 py-2 text-sm font-medium hover:bg-teal-700 w-full sm:w-auto"
        >
          + {t("children.addNew")}
        </button>
      </div>

      {/* Filters toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("common.search")}
          className="w-full sm:w-64 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-full sm:w-48 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
        >
          <option value="tous">{t("children.allStatuses")}</option>
          <option value="actif">{t("children.statusActive")}</option>
          <option value="en_attente">{t("children.statusPending")}</option>
          <option value="retire">{t("children.statusWithdrawn")}</option>
        </select>
      </div>

      {/* Desktop table */}
      <div className="hidden md:block bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
            <tr>
              <th className="text-start px-4 py-3">{t("children.fullName")}</th>
              <th className="text-start px-4 py-3">{t("children.birthDate")}</th>
              <th className="text-start px-4 py-3">{t("children.parent")}</th>
              <th className="text-start px-4 py-3">{t("children.status")}</th>
              <th className="text-start px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((child) => (
              <tr
                key={child.id}
                className="border-t border-gray-100 hover:bg-gray-50 cursor-pointer"
                onClick={() => navigate(`/creche/enfants/${child.id}`)}
              >
                <td className="px-4 py-3 font-medium text-gray-800">
                  {child.prenom} {child.nom}
                </td>
                <td className="px-4 py-3 text-gray-600">{child.dateNaissance}</td>
                <td className="px-4 py-3 text-gray-600">{child.parentNom}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusStyles[child.statut]}`}>
                    {t(`children.status${child.statut.charAt(0).toUpperCase() + child.statut.slice(1)}`)}
                  </span>
                </td>
                <td className="px-4 py-3 text-end text-teal-600 font-medium">→</td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                  {t("common.noResults")}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {filtered.map((child) => (
          <div
            key={child.id}
            onClick={() => navigate(`/creche/enfants/${child.id}`)}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 active:bg-gray-50"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-medium text-gray-800">{child.prenom} {child.nom}</span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusStyles[child.statut]}`}>
                {t(`children.status${child.statut.charAt(0).toUpperCase() + child.statut.slice(1)}`)}
              </span>
            </div>
            <p className="text-sm text-gray-500">{child.parentNom}</p>
            <p className="text-xs text-gray-400 mt-1">{child.dateNaissance}</p>
          </div>
        ))}
        {filtered.length === 0 && (
          <p className="text-center text-gray-400 py-8">{t("common.noResults")}</p>
        )}
      </div>
    </div>
  );
}
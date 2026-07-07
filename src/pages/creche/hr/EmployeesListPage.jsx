import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { fetchEmployees } from "../../../lib/api/employees.js";
import { useAuth } from "../../../lib/auth/AuthContext.jsx";

const statusStyles = {
  actif: "bg-green-50 text-green-700",
  conge: "bg-yellow-50 text-yellow-700",
  inactif: "bg-gray-100 text-gray-500",
};

export default function EmployeesListPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isManager = user?.role === "manager";

  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchEmployees()
      .then(setEmployees)
      .catch((err) => setError(err.response?.data?.message || t("common.error")))
      .finally(() => setLoading(false));
  }, [t]);

  const filtered = employees.filter((e) =>
    e.nom.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className="text-xl font-bold text-gray-800">{t("nav.hr")}</h1>
        {isManager && (
          <button
            onClick={() => navigate("/creche/hr/nouveau")}
            className="bg-teal-600 text-white rounded-md px-4 py-2 text-sm font-medium hover:bg-teal-700 w-full sm:w-auto"
          >
            + {t("hr.addEmployee")}
          </button>
        )}
      </div>

      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-2">{error}</p>}
      {loading && <p className="text-gray-400 text-sm">{t("common.loading")}</p>}

      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder={t("common.search")}
        className="w-full sm:w-64 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
      />

      {/* Desktop table */}
      <div className="hidden md:block bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
            <tr>
              <th className="text-start px-4 py-3">{t("hr.name")}</th>
              <th className="text-start px-4 py-3">{t("hr.position")}</th>
              <th className="text-start px-4 py-3">{t("hr.hireDate")}</th>
              <th className="text-start px-4 py-3">{t("children.status")}</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((emp) => (
              <tr
                key={emp.id}
                className="border-t border-gray-100 hover:bg-gray-50 cursor-pointer"
                onClick={() => navigate(`/creche/hr/${emp.id}`)}
              >
                <td className="px-4 py-3 font-medium text-gray-800">{emp.nom}</td>
                <td className="px-4 py-3 text-gray-600">{emp.poste}</td>
                <td className="px-4 py-3 text-gray-600">{emp.dateEmbauche}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusStyles[emp.statut]}`}>
                    {t(`hr.status${emp.statut.charAt(0).toUpperCase() + emp.statut.slice(1)}`)}
                  </span>
                </td>
                <td className="px-4 py-3 text-end text-teal-600 font-medium">→</td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">{t("common.noResults")}</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {filtered.map((emp) => (
          <div
            key={emp.id}
            onClick={() => navigate(`/creche/hr/${emp.id}`)}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 active:bg-gray-50"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-medium text-gray-800">{emp.nom}</span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusStyles[emp.statut]}`}>
                {t(`hr.status${emp.statut.charAt(0).toUpperCase() + emp.statut.slice(1)}`)}
              </span>
            </div>
            <p className="text-sm text-gray-500">{emp.poste}</p>
            <p className="text-xs text-gray-400 mt-1">{emp.dateEmbauche}</p>
          </div>
        ))}
        {filtered.length === 0 && <p className="text-center text-gray-400 py-8">{t("common.noResults")}</p>}
      </div>
    </div>
  );
}
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { fetchChildren } from "../../../lib/api/children.js";
import { fetchChildAbsences } from "../../../lib/api/absences.js";

// The backend has no crèche-wide "GET /absences" endpoint — only
// GET /absences/child/{childId}. We fetch the children list, then pull
// each child's absences and flatten them into one log.
async function fetchAllAbsences() {
  const children = await fetchChildren();
  const perChild = await Promise.all(
    children.map((c) =>
      fetchChildAbsences(c.id)
        .then((list) =>
          (Array.isArray(list) ? list : list.items || []).map((a) => ({
            id: a.id,
            childId: c.id,
            childName: `${c.prenom} ${c.nom}`,
            date: a.date,
            motif: a.reason || a.motif || "",
            justifie: a.justified ?? a.justifie ?? false,
          }))
        )
        .catch(() => [])
    )
  );
  return perChild.flat().sort((a, b) => (a.date < b.date ? 1 : -1));
}

export default function AbsenceTrackingPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [absences, setAbsences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("toutes"); // toutes | justifiee | non_justifiee

  useEffect(() => {
    fetchAllAbsences()
      .then(setAbsences)
      .catch((err) => setError(err.response?.data?.message || t("common.error")))
      .finally(() => setLoading(false));
  }, [t]);

  const filtered = absences.filter((a) => {
    if (filter === "toutes") return true;
    if (filter === "justifiee") return a.justifie;
    return !a.justifie;
  });

  const unjustifiedCount = absences.filter((a) => !a.justifie).length;

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-800">{t("children.absenceTracking")}</h1>
          {unjustifiedCount > 0 && (
            <p className="text-sm text-yellow-600 mt-1">
              {t("children.unjustifiedCount", { count: unjustifiedCount })}
            </p>
          )}
        </div>

        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="w-full sm:w-56 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
        >
          <option value="toutes">{t("children.allAbsences")}</option>
          <option value="justifiee">{t("children.justified")}</option>
          <option value="non_justifiee">{t("children.unjustified")}</option>
        </select>
      </div>

      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-2">{error}</p>}
      {loading && <p className="text-gray-400 text-sm">{t("common.loading")}</p>}

      {/* Desktop table */}
      <div className="hidden md:block bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
            <tr>
              <th className="text-start px-4 py-3">{t("children.fullName")}</th>
              <th className="text-start px-4 py-3">{t("children.date")}</th>
              <th className="text-start px-4 py-3">{t("children.reason")}</th>
              <th className="text-start px-4 py-3">{t("children.status")}</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((a) => (
              <tr
                key={a.id}
                className="border-t border-gray-100 hover:bg-gray-50 cursor-pointer"
                onClick={() => navigate(`/creche/enfants/${a.childId}`)}
              >
                <td className="px-4 py-3 font-medium text-gray-800">{a.childName}</td>
                <td className="px-4 py-3 text-gray-600">{a.date}</td>
                <td className="px-4 py-3 text-gray-600">{a.motif}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    a.justifie ? "bg-green-50 text-green-700" : "bg-yellow-50 text-yellow-700"
                  }`}>
                    {a.justifie ? t("children.justified") : t("children.unjustified")}
                  </span>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-gray-400">
                  {t("common.noResults")}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {filtered.map((a) => (
          <div
            key={a.id}
            onClick={() => navigate(`/creche/enfants/${a.childId}`)}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 active:bg-gray-50"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-medium text-gray-800">{a.childName}</span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                a.justifie ? "bg-green-50 text-green-700" : "bg-yellow-50 text-yellow-700"
              }`}>
                {a.justifie ? t("children.justified") : t("children.unjustified")}
              </span>
            </div>
            <p className="text-sm text-gray-500">{a.motif}</p>
            <p className="text-xs text-gray-400 mt-1">{a.date}</p>
          </div>
        ))}
        {filtered.length === 0 && (
          <p className="text-center text-gray-400 py-8">{t("common.noResults")}</p>
        )}
      </div>
    </div>
  );
}
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { fetchClasses } from "../../../lib/api/classes.js";
import { useAuth } from "../../../lib/auth/AuthContext.jsx";

export default function ClassesListPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [classesData, setClassesData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchClasses()
      .then(setClassesData)
      .catch((err) => setError(err.response?.data?.message || t("common.error")))
      .finally(() => setLoading(false));
  }, [t]);

  const isManager = user?.role === "manager";

  // Each backend "class" is an age bracket; the groups nested inside it are
  // what actually hold children and a teacher, so those are what we show as cards.
  const classes = classesData.flatMap((cls) =>
    (cls.groups || []).map((g) => ({ ...g, tranche: cls.tranche, className: cls.nom }))
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className="text-xl font-bold text-gray-800">{t("nav.classes")}</h1>
        {isManager && (
          <button
            onClick={() => navigate("/creche/classes/nouveau")}
            className="bg-teal-600 text-white rounded-md px-4 py-2 text-sm font-medium hover:bg-teal-700 w-full sm:w-auto"
          >
            + {t("classes.addNew")}
          </button>
        )}
      </div>

      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-2">{error}</p>}
      {loading && <p className="text-gray-400 text-sm">{t("common.loading")}</p>}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {classes.map((c) => {
          const count = c.enfantIds.length;
          const isFull = count >= c.seuilMax;
          const isNearFull = count >= c.seuilMax * 0.85 && !isFull;

          return (
            <div
              key={c.id}
              onClick={() => navigate(`/creche/classes/${c.id}`)}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 cursor-pointer hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-gray-800">{c.className} — {c.nom}</h3>
                <span className="text-xs text-gray-400">{c.tranche}</span>
              </div>

              <p className="text-sm text-gray-500 mb-3">{c.enseignant}</p>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">
                  {count}/{c.seuilMax} {t("classes.children")}
                </span>
                {isFull && (
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-50 text-red-600">
                    {t("classes.full")}
                  </span>
                )}
                {isNearFull && (
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-50 text-yellow-700">
                    {t("classes.nearFull")}
                  </span>
                )}
              </div>

              {/* Progress bar */}
              <div className="mt-3 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full ${isFull ? "bg-red-500" : isNearFull ? "bg-yellow-500" : "bg-teal-500"}`}
                  style={{ width: `${Math.min((count / c.seuilMax) * 100, 100)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {classes.length === 0 && (
        <p className="text-center text-gray-400 py-12">{t("common.noResults")}</p>
      )}
    </div>
  );
}
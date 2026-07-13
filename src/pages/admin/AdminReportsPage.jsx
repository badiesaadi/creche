import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { fetchAdminChildren, fetchAdminEmployees, fetchAdminFinancial, fetchAdminReports } from "../../lib/api/admin.js";
import { fetchCreches } from "../../lib/api/creches.js";

function pick(obj, ...keys) {
  for (const k of keys) {
    if (obj?.[k] !== undefined && obj?.[k] !== null) return obj[k];
  }
  return null;
}

function extractRevenueRows(data, crecheNameById) {
  const rows = Array.isArray(data) ? data : data?.byMonth || data?.rows || data?.items;
  if (!Array.isArray(rows)) return [];
  return rows.map((r, i) => ({
    creche: crecheNameById[pick(r, "crecheId", "creche_id")] || pick(r, "crecheName", "creche") || "—",
    mois: pick(r, "month", "mois", "period"),
    collected: Number(pick(r, "collected", "revenue", "income") ?? 0),
    pending: Number(pick(r, "pending", "outstanding", "late") ?? 0),
    expenses: Number(pick(r, "expenses", "charges", "expense") ?? 0),
  })).filter((r) => r.mois);
}

// /admin/reports doesn't return a fixed set of fields — try to find a
// network-wide absence list inside it. If the shape doesn't match, the
// absence report is simply unavailable rather than fabricated.
function extractAbsenceRows(data, crecheNameById) {
  const rows = Array.isArray(data) ? data : data?.absences || data?.items;
  if (!Array.isArray(rows)) return [];
  return rows.map((a, i) => ({
    id: pick(a, "id") ?? i,
    nom: pick(a, "childName", "employeeName", "name", "nom") || "—",
    categorie: pick(a, "type", "category") === "EMPLOYEE" ? "personnel" : "enfant",
    creche: crecheNameById[pick(a, "crecheId")] || pick(a, "creche") || "—",
    date: pick(a, "date"),
    motif: pick(a, "reason", "motif") || "",
    justifie: pick(a, "justified", "justifie") ?? false,
  })).filter((a) => a.date);
}

export default function AdminReportsPage() {
  const { t } = useTranslation();

  const [crecheFilter, setCrecheFilter] = useState("toutes");
  const [moisFilter, setMoisFilter] = useState("tous");
  const [categorieFilter, setCategorieFilter] = useState("toutes");

  const [creches, setCreches] = useState([]);
  const [children, setChildren] = useState([]);
  const [staff, setStaff] = useState([]);
  const [financeRows, setFinanceRows] = useState([]);
  const [absenceRows, setAbsenceRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchCreches()
      .then(async (crechesList) => {
        setCreches(crechesList);
        const nameById = Object.fromEntries(crechesList.map((c) => [c.id, c.nom]));
        const [childrenList, staffList, financial, reportsData] = await Promise.all([
          fetchAdminChildren().catch(() => []),
          fetchAdminEmployees().catch(() => []),
          fetchAdminFinancial().catch(() => null),
          fetchAdminReports().catch(() => null),
        ]);
        setChildren(childrenList);
        setStaff(staffList);
        setFinanceRows(extractRevenueRows(financial, nameById));
        setAbsenceRows(extractAbsenceRows(reportsData, nameById));
      })
      .catch((err) => setError(err.response?.data?.message || t("common.error")))
      .finally(() => setLoading(false));
  }, [t]);

  const crecheNames = creches.map((c) => c.nom);
  const months = [...new Set(financeRows.map((f) => f.mois))];

  const filteredFinance = financeRows.filter((f) =>
    (crecheFilter === "toutes" || f.creche === crecheFilter) &&
    (moisFilter === "tous" || f.mois === moisFilter)
  );
  const filteredChildren = children.filter((c) =>
    crecheFilter === "toutes" || c.creche === crecheFilter
  );
  const filteredStaff = staff.filter((e) =>
    crecheFilter === "toutes" || e.creche === crecheFilter
  );
  const filteredAbsences = absenceRows.filter((a) =>
    (crecheFilter === "toutes" || a.creche === crecheFilter) &&
    (categorieFilter === "toutes" || a.categorie === categorieFilter)
  );

  const reports = [
    { key: "monthlyFinance", available: financeRows.length > 0 },
    { key: "childrenNetwork", available: true },
    { key: "staffSummary", available: true },
    { key: "absenceReport", available: absenceRows.length > 0 },
  ];

  function handlePrintReport(key) {
    const win = window.open("", "_blank");
    let html;

    if (key === "monthlyFinance") {
      const rows = filteredFinance.map((f) =>
        `<tr><td>${f.creche}</td><td>${f.mois}</td><td>${f.collected.toLocaleString()} DZD</td><td>${f.expenses.toLocaleString()} DZD</td><td>${(f.collected - f.expenses).toLocaleString()} DZD</td></tr>`
      ).join("");
      html = `<h2>${t("admin.report_monthlyFinance")}</h2><table border="1" cellpadding="6" style="border-collapse:collapse;width:100%"><thead><tr><th>Crèche</th><th>Mois</th><th>Collecté</th><th>Charges</th><th>Net</th></tr></thead><tbody>${rows}</tbody></table>`;
    } else if (key === "childrenNetwork") {
      const rows = filteredChildren.map((c) => {
        const docCount = c.documents?.length || 0;
        const docsProvided = c.documents?.filter((d) => d.isProvided).length || 0;
        return `<tr><td>${docsProvided}/${docCount}</td><td>${c.prenom} ${c.nom}</td><td>${c.creche || ""}</td><td>${c.dateInscription || ""}</td></tr>`;
      }).join("");
      html = `<h2>${t("admin.report_childrenNetwork")}</h2><table border="1" cellpadding="6" style="border-collapse:collapse;width:100%"><thead><tr><th>${t("children.tabDocuments")}</th><th>Nom</th><th>Crèche</th><th>Inscription</th></tr></thead><tbody>${rows}</tbody></table>`;
    } else if (key === "staffSummary") {
      const rows = filteredStaff.map((e) =>
        `<tr><td>${e.nom}</td><td>${e.creche || ""}</td><td>${e.poste || ""}</td><td>${(e.salaire || 0).toLocaleString()} DZD</td></tr>`
      ).join("");
      html = `<h2>${t("admin.report_staffSummary")}</h2><table border="1" cellpadding="6" style="border-collapse:collapse;width:100%"><thead><tr><th>Nom</th><th>Crèche</th><th>Poste</th><th>Salaire</th></tr></thead><tbody>${rows}</tbody></table>`;
    } else {
      const rows = filteredAbsences.map((a) =>
        `<tr><td>${a.nom}</td><td>${a.categorie === "enfant" ? "Enfant" : "Personnel"}</td><td>${a.creche}</td><td>${a.date}</td><td>${a.motif}</td><td>${a.justifie ? "Justifiée" : "Non justifiée"}</td></tr>`
      ).join("");
      html = `<h2>${t("admin.report_absenceReport")}</h2><table border="1" cellpadding="6" style="border-collapse:collapse;width:100%"><thead><tr><th>Nom</th><th>Catégorie</th><th>Crèche</th><th>Date</th><th>Motif</th><th>Statut</th></tr></thead><tbody>${rows}</tbody></table>`;
    }

    win.document.write(`<!DOCTYPE html><html><head><title>${t(`admin.report_${key}`)}</title><style>body{font-family:sans-serif;padding:24px}table{width:100%}th{background:#f3f4f6}</style></head><body>${html}</body></html>`);
    win.document.close();
    win.print();
  }

  function handleExportCSV(key) {
    let csv = "";
    if (key === "monthlyFinance") {
      const headers = ["Crèche", "Mois", "Collecté", "En attente", "Charges", "Net"];
      const rows = filteredFinance.map((f) => [f.creche, f.mois, f.collected, f.pending, f.expenses, f.collected - f.expenses]);
      csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    } else if (key === "childrenNetwork") {
      const headers = ["Documents fournis", "Prénom", "Nom", "Crèche", "Date Inscription"];
      const rows = filteredChildren.map((c) => {
        const docCount = c.documents?.length || 0;
        const docsProvided = c.documents?.filter((d) => d.isProvided).length || 0;
        return [`${docsProvided}/${docCount}`, c.prenom, c.nom, c.creche || "", c.dateInscription || ""];
      });
      csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    } else if (key === "staffSummary") {
      const headers = ["Nom", "Crèche", "Poste", "Salaire", "Statut"];
      const rows = filteredStaff.map((e) => [e.nom, e.creche || "", e.poste || "", e.salaire || 0, e.statut || ""]);
      csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    } else if (key === "absenceReport") {
      const headers = ["Nom", "Catégorie", "Crèche", "Date", "Motif", "Justifiée"];
      const rows = filteredAbsences.map((a) => [a.nom, a.categorie, a.creche, a.date, a.motif, a.justifie ? "Oui" : "Non"]);
      csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    }
    if (!csv) return;
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `rapport-${key}.csv`; a.click();
    URL.revokeObjectURL(url);
  }

  if (loading) {
    return <p className="text-gray-400 text-sm">{t("common.loading")}</p>;
  }

  return (
    <div className="space-y-5 max-w-2xl">
      <h1 className="text-xl font-bold text-gray-800">{t("nav.reports")}</h1>

      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-2">{error}</p>}

      {/* Filters — apply to every report below (period, crèche, category) */}
      <div className="flex flex-col sm:flex-row gap-3">
        <select value={crecheFilter} onChange={(e) => setCrecheFilter(e.target.value)}
          className="w-full sm:w-48 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500">
          <option value="toutes">{t("admin.allCreches")}</option>
          {crecheNames.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={moisFilter} onChange={(e) => setMoisFilter(e.target.value)}
          className="w-full sm:w-48 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500">
          <option value="tous">{t("admin.allMonths")}</option>
          {months.map((m) => <option key={m} value={m}>{m}</option>)}
        </select>
        <select value={categorieFilter} onChange={(e) => setCategorieFilter(e.target.value)}
          className="w-full sm:w-48 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500">
          <option value="toutes">{t("admin.allCategories")}</option>
          <option value="enfant">{t("admin.childCategory")}</option>
          <option value="personnel">{t("admin.staffCategory")}</option>
        </select>
      </div>

      <div className="space-y-3">
        {reports.map((r) => (
          <div key={r.key} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <p className="font-medium text-gray-800">{t(`admin.report_${r.key}`)}</p>
              {!r.available && <p className="text-xs text-yellow-600 mt-0.5">{t("admin.reportDataUnavailable")}</p>}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleExportCSV(r.key)}
                disabled={!r.available}
                className="px-3 py-1.5 rounded-md border border-gray-300 text-gray-700 text-sm hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                CSV
              </button>
              <button
                onClick={() => handlePrintReport(r.key)}
                disabled={!r.available}
                className="px-3 py-1.5 rounded-md bg-teal-600 text-white text-sm font-medium hover:bg-teal-700 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {t("admin.exportPdf")}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

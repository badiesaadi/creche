import { useTranslation } from "react-i18next";
import { mockGlobalFinance, mockGlobalHR, mockNetworkChildren } from "../../data/mockAdmin.js";

const reports = [
  { key: "monthlyFinance" },
  { key: "childrenNetwork" },
  { key: "staffSummary" },
  { key: "absenceReport" },
];

export default function AdminReportsPage() {
  const { t } = useTranslation();

  function handlePrintReport(key) {
    const win = window.open("", "_blank");
    let html = "";

    if (key === "monthlyFinance") {
      const rows = mockGlobalFinance.map((f) =>
        `<tr><td>${f.creche}</td><td>${f.mois}</td><td>${f.collected.toLocaleString()} DZD</td><td>${f.expenses.toLocaleString()} DZD</td><td>${(f.collected - f.expenses).toLocaleString()} DZD</td></tr>`
      ).join("");
      html = `<h2>${t("admin.report_monthlyFinance")}</h2><table border="1" cellpadding="6" style="border-collapse:collapse;width:100%"><thead><tr><th>Crèche</th><th>Mois</th><th>Collecté</th><th>Charges</th><th>Net</th></tr></thead><tbody>${rows}</tbody></table>`;
    } else if (key === "childrenNetwork") {
      const rows = mockNetworkChildren.map((c) =>
        `<tr><td>${c.prenom} ${c.nom}</td><td>${c.creche}</td><td>${c.dateInscription}</td><td>${c.assure ? "Oui" : "Non"}</td></tr>`
      ).join("");
      html = `<h2>${t("admin.report_childrenNetwork")}</h2><table border="1" cellpadding="6" style="border-collapse:collapse;width:100%"><thead><tr><th>Nom</th><th>Crèche</th><th>Inscription</th><th>Assuré</th></tr></thead><tbody>${rows}</tbody></table>`;
    } else if (key === "staffSummary") {
      const rows = mockGlobalHR.map((e) =>
        `<tr><td>${e.nom}</td><td>${e.creche}</td><td>${e.poste}</td><td>${e.salaire.toLocaleString()} DZD</td></tr>`
      ).join("");
      html = `<h2>${t("admin.report_staffSummary")}</h2><table border="1" cellpadding="6" style="border-collapse:collapse;width:100%"><thead><tr><th>Nom</th><th>Crèche</th><th>Poste</th><th>Salaire</th></tr></thead><tbody>${rows}</tbody></table>`;
    } else {
      html = `<h2>${t("admin.report_absenceReport")}</h2><p>${t("admin.reportsComingSoon")}</p>`;
    }

    win.document.write(`<!DOCTYPE html><html><head><title>${t(`admin.report_${key}`)}</title><style>body{font-family:sans-serif;padding:24px}table{width:100%}th{background:#f3f4f6}</style></head><body>${html}</body></html>`);
    win.document.close();
    win.print();
  }

  function handleExportCSV(key) {
    let csv = "";
    if (key === "monthlyFinance") {
      const headers = ["Crèche", "Mois", "Collecté", "En attente", "Charges", "Net"];
      const rows = mockGlobalFinance.map((f) => [f.creche, f.mois, f.collected, f.pending, f.expenses, f.collected - f.expenses]);
      csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    } else if (key === "childrenNetwork") {
      const headers = ["Prénom", "Nom", "Crèche", "Date Inscription", "Assuré"];
      const rows = mockNetworkChildren.map((c) => [c.prenom, c.nom, c.creche, c.dateInscription, c.assure ? "Oui" : "Non"]);
      csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    } else if (key === "staffSummary") {
      const headers = ["Nom", "Crèche", "Poste", "Salaire", "Statut"];
      const rows = mockGlobalHR.map((e) => [e.nom, e.creche, e.poste, e.salaire, e.statut]);
      csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    }
    if (!csv) return;
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `rapport-${key}.csv`; a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-5 max-w-2xl">
      <h1 className="text-xl font-bold text-gray-800">{t("nav.reports")}</h1>
      <div className="space-y-3">
        {reports.map((r) => (
          <div key={r.key} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <p className="font-medium text-gray-800">{t(`admin.report_${r.key}`)}</p>
            <div className="flex gap-2">
              {r.key !== "absenceReport" && (
                <button
                  onClick={() => handleExportCSV(r.key)}
                  className="px-3 py-1.5 rounded-md border border-gray-300 text-gray-700 text-sm hover:bg-gray-50"
                >
                  CSV
                </button>
              )}
              <button
                onClick={() => handlePrintReport(r.key)}
                className="px-3 py-1.5 rounded-md bg-teal-600 text-white text-sm font-medium hover:bg-teal-700"
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

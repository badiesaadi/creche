// src/lib/api/settings.js
import { apiClient } from "./client.js";

// Backend fields <-> frontend form fields used in SettingsPage.
export function settingsFromApi(apiSettings) {
  return {
    fraisInscription: apiSettings.registrationFee,
    fraisMensuel: apiSettings.monthlyFee,
    seuilGroupe: apiSettings.groupSizeThreshold,
    seuilAbsence: apiSettings.absenceThreshold,
    joursRappelPaiement: apiSettings.paymentReminderDays,
    typeEvaluation: apiSettings.evalPeriodType === "SEMESTRE" ? "semestre" : "trimestre",
  };
}

export function settingsToApi(form) {
  return {
    registrationFee: form.fraisInscription !== undefined ? Number(form.fraisInscription) : undefined,
    monthlyFee: form.fraisMensuel !== undefined ? Number(form.fraisMensuel) : undefined,
    groupSizeThreshold: form.seuilGroupe !== undefined ? Number(form.seuilGroupe) : undefined,
    absenceThreshold: form.seuilAbsence !== undefined ? Number(form.seuilAbsence) : undefined,
    paymentReminderDays: form.joursRappelPaiement !== undefined ? Number(form.joursRappelPaiement) : undefined,
    evalPeriodType: form.typeEvaluation === "semestre" ? "SEMESTRE" : "TRIMESTRE",
  };
}

export async function fetchSettings() {
  const res = await apiClient.get("/settings");
  return settingsFromApi(res.data.data);
}

export async function updateSettings(form) {
  const res = await apiClient.patch("/settings", settingsToApi(form));
  return settingsFromApi(res.data.data);
}

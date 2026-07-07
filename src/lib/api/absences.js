// src/lib/api/absences.js
import { apiClient } from "./client.js";

export async function recordAbsence(childId, date) {
  const res = await apiClient.post("/absences", { childId, date });
  return res.data.data;
}

// Mark a whole group's attendance at once: everyone in `absentChildIds` is absent that day.
export async function recordBulkAbsences(groupId, date, absentChildIds) {
  const res = await apiClient.post("/absences/bulk", { groupId, date, absentChildIds });
  return res.data.data;
}

export async function fetchChildAbsences(childId) {
  const res = await apiClient.get(`/absences/child/${childId}`);
  return res.data.data;
}

export async function deleteAbsence(id) {
  await apiClient.delete(`/absences/${id}`);
}

// src/lib/api/evaluations.js
import { apiClient } from "./client.js";

export async function createEvaluation({ childId, period, criteria, score, comment }) {
  const res = await apiClient.post("/evaluations", { childId, period, criteria, score, comment });
  return res.data.data;
}

export async function fetchChildEvaluations(childId) {
  const res = await apiClient.get(`/evaluations/child/${childId}`);
  return res.data.data;
}

export async function fetchGroupEvaluations(groupId) {
  const res = await apiClient.get(`/evaluations/group/${groupId}`);
  return res.data.data;
}

export async function updateEvaluation(id, payload) {
  const res = await apiClient.patch(`/evaluations/${id}`, payload);
  return res.data.data;
}

export async function deleteEvaluation(id) {
  await apiClient.delete(`/evaluations/${id}`);
}

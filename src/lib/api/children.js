// src/lib/api/children.js
import { apiClient } from "./client.js";
import { childToApi, childFromApi, childUpdateToApi } from "./adapters.js";

export async function fetchChildren(params = {}) {
  // params: { page, limit, groupId, isActive, dossierStatus }
  const res = await apiClient.get("/children", { params });
  const list = Array.isArray(res.data.data) ? res.data.data : res.data.data?.items || [];
  return list.map(childFromApi);
}

export async function fetchChild(id) {
  const res = await apiClient.get(`/children/${id}`);
  return childFromApi(res.data.data);
}

// Full history (absences, evaluations, payments...) for the child detail page.
export async function fetchChildFull(id) {
  const res = await apiClient.get(`/children/${id}/all`);
  return res.data.data;
}

export async function createChild(form, documents = []) {
  const payload = childToApi(form);
  if (documents.length) payload.documents = documents;
  const res = await apiClient.post("/children", payload);
  return childFromApi(res.data.data);
}

export async function updateChild(id, form) {
  const res = await apiClient.patch(`/children/${id}`, childUpdateToApi(form));
  return childFromApi(res.data.data);
}

// "Withdrawal" in the UI = archiving the child's file on the backend.
export async function withdrawChild(id, { date, reason } = {}) {
  const res = await apiClient.patch(`/children/${id}/exit`, { date, reason });
  return childFromApi(res.data.data);
}

export async function restoreChild(id) {
  const res = await apiClient.patch(`/children/${id}/restore`);
  return childFromApi(res.data.data);
}

export async function updateChildDocument(id, documentId, payload) {
  const res = await apiClient.patch(`/children/${id}/documents/${documentId}`, payload);
  return res.data.data;
}

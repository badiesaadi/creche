// src/lib/api/creches.js
import { apiClient } from "./client.js";
import { crecheToApi, crecheFromApi } from "./adapters.js";

export async function fetchCreches() {
  const res = await apiClient.get("/creches");
  return res.data.data.map(crecheFromApi);
}

export async function fetchCreche(id) {
  const res = await apiClient.get(`/creches/${id}`);
  return crecheFromApi(res.data.data);
}

export async function createCreche(form) {
  const res = await apiClient.post("/creches", crecheToApi(form));
  return crecheFromApi(res.data.data);
}

export async function updateCreche(id, form) {
  const res = await apiClient.patch(`/creches/${id}`, crecheToApi(form));
  return crecheFromApi(res.data.data);
}

export async function activateCreche(id) {
  const res = await apiClient.patch(`/creches/${id}/activate`);
  return crecheFromApi(res.data.data);
}

export async function deactivateCreche(id) {
  const res = await apiClient.patch(`/creches/${id}/deactivate`);
  return crecheFromApi(res.data.data);
}

export async function assignCrecheResponsable(crecheId, userId) {
  const res = await apiClient.post(`/creches/${crecheId}/assign-responsable`, { userId });
  return crecheFromApi(res.data.data);
}

export async function restoreCrecheResponsable(userId) {
  const res = await apiClient.patch(`/creches/responsable/${userId}/restore`);
  return res.data.data;
}

// src/lib/api/classes.js
import { apiClient } from "./client.js";
import { classToApi, classFromApi, groupToApi, groupFromApi } from "./adapters.js";

// ---------- Classes ----------
export async function fetchClasses() {
  const res = await apiClient.get("/classes");
  const list = Array.isArray(res.data.data) ? res.data.data : res.data.data?.items || [];
  return list.map(classFromApi);
}

export async function fetchClass(id) {
  const res = await apiClient.get(`/classes/${id}`);
  return classFromApi(res.data.data);
}

export async function createClass(form) {
  const res = await apiClient.post("/classes", classToApi(form));
  return classFromApi(res.data.data);
}

export async function updateClass(id, form) {
  const res = await apiClient.patch(`/classes/${id}`, classToApi(form));
  return classFromApi(res.data.data);
}

export async function deleteClass(id) {
  await apiClient.delete(`/classes/${id}/delete`);
}

// When a class fills up, the backend auto-splits it into a new group.
export async function splitClass(id) {
  const res = await apiClient.post(`/classes/${id}/split`);
  return res.data.data;
}

// ---------- Groups ----------
export async function fetchGroup(id) {
  const res = await apiClient.get(`/groups/${id}`);
  return groupFromApi(res.data.data);
}

export async function createGroup(form, classId) {
  const res = await apiClient.post("/groups", groupToApi(form, classId));
  return groupFromApi(res.data.data);
}

export async function updateGroup(id, form) {
  const res = await apiClient.patch(`/groups/${id}`, {
    name: form.nom ?? form.name,
    maxCapacity: form.seuilMax ?? form.maxCapacity ? Number(form.seuilMax ?? form.maxCapacity) : undefined,
  });
  return groupFromApi(res.data.data);
}

export async function assignChildToGroup(groupId, childId) {
  const res = await apiClient.post(`/groups/${groupId}/assign`, { childId });
  return res.data.data; // { autoCreated: boolean }
}

export async function removeChildFromGroup(groupId, childId) {
  await apiClient.delete(`/groups/${groupId}/children/${childId}`);
}

export async function assignGroupTeacher(groupId, employeeId) {
  const res = await apiClient.patch(`/groups/${groupId}/teacher`, { employeeId });
  return groupFromApi(res.data.data);
}

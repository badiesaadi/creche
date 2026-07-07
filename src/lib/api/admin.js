// src/lib/api/admin.js
import { apiClient } from "./client.js";
import { childFromApi, employeeFromApi, chargeFromApi, chargeToApi } from "./adapters.js";

export async function fetchAdminDashboard() {
  const res = await apiClient.get("/admin/dashboard");
  return res.data.data;
}

// month: "YYYY-MM", crecheId: optional filter
export async function fetchAdminFinancial({ month, crecheId } = {}) {
  const res = await apiClient.get("/admin/financial", { params: { month, crecheId } });
  return res.data.data;
}

export async function fetchAdminChildren({ crecheId, isActive } = {}) {
  const res = await apiClient.get("/admin/children", { params: { crecheId, isActive } });
  return res.data.data.map(childFromApi);
}

export async function fetchAdminEmployees({ crecheId, isActive } = {}) {
  const res = await apiClient.get("/admin/employees", { params: { crecheId, isActive } });
  return res.data.data.map(employeeFromApi);
}

export async function fetchAdminReports() {
  const res = await apiClient.get("/admin/reports");
  return res.data.data;
}

export async function fetchCharges({ month, crecheId, crecheNameById = {} } = {}) {
  const res = await apiClient.get("/admin/charges", { params: { month, crecheId } });
  const list = Array.isArray(res.data.data) ? res.data.data : res.data.data?.items || [];
  return list.map((c) => chargeFromApi(c, crecheNameById[c.crecheId]));
}

export async function addCharge(form) {
  const res = await apiClient.post("/admin/charges", chargeToApi(form));
  return chargeFromApi(res.data.data);
}

export async function updateCharge(id, form) {
  const res = await apiClient.patch(`/admin/charges/${id}`, chargeToApi(form));
  return chargeFromApi(res.data.data);
}

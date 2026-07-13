// src/lib/api/employees.js
import { apiClient } from "./client.js";
import { employeeToApi, employeeFromApi, employeeUpdateToApi, contractToApi } from "./adapters.js";

export async function fetchEmployees() {
  // Network-wide list (admin). Creche-scoped managers use GET /employees too,
  // scoped server-side by their JWT.
  const res = await apiClient.get("/employees");
  return res.data.data.map(employeeFromApi);
}

export async function fetchEmployee(id) {
  const res = await apiClient.get(`/employees/${id}`);
  return employeeFromApi(res.data.data);
}

export async function createEmployee(form) {
  const res = await apiClient.post("/employees", employeeToApi(form));
  return employeeFromApi(res.data.data);
}

export async function updateEmployee(id, form) {
  const res = await apiClient.patch(`/employees/${id}`, employeeUpdateToApi(form));
  return employeeFromApi(res.data.data);
}

export async function deleteEmployee(id) {
  await apiClient.delete(`/employees/${id}/delete`);
}

export async function addContract(employeeId, form) {
  const res = await apiClient.post(`/employees/${employeeId}/contracts`, contractToApi(form));
  return res.data.data;
}

export async function addBonus(employeeId, montant, motif, period = new Date().toISOString().slice(0, 7)) {
  const res = await apiClient.post("/admin/bonus", { employeeId, amount: Number(montant), reason: motif, period });
  return res.data.data;
}

export async function addPayslip(employeeId, period, bonuses = 0) {
  const res = await apiClient.post(`/employees/${employeeId}/payslips`, { period, bonuses: Number(bonuses) });
  return res.data.data;
}

// Full history (contracts, absences, payslips...) for the employee detail page.
export async function fetchEmployeeFull(id) {
  const res = await apiClient.get(`/employees/${id}`, { params: { all: true } });
  return res.data.data;
}

export async function restoreEmployee(id) {
  const res = await apiClient.patch(`/employees/${id}/restore`);
  return employeeFromApi(res.data.data);
}

export async function addEmployeeAbsence(employeeId, startDate, endDate = startDate, type = "CONGE", justification = "") {
  const res = await apiClient.post(`/employees/${employeeId}/absences`, {
    type,
    startDate,
    endDate,
    ...(justification ? { justification } : {}),
  });
  return res.data.data;
}

export async function assignEmployeeGroup(employeeId, groupId) {
  const res = await apiClient.post(`/employees/${employeeId}/assign-group`, { groupId });
  return employeeFromApi(res.data.data);
}

export async function unassignEmployeeGroup(employeeId, groupId) {
  const res = await apiClient.post(`/employees/${employeeId}/unassign-group`, { groupId });
  return employeeFromApi(res.data.data);
}


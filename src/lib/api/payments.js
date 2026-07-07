// src/lib/api/payments.js
import { apiClient } from "./client.js";
import { paymentFromApi, paymentUpdateToApi, paymentScheduleToApi } from "./adapters.js";

export async function fetchChildPayments(childId) {
  const res = await apiClient.get(`/payments/child/${childId}`);
  const list = Array.isArray(res.data.data) ? res.data.data : res.data.data?.items || [];
  return list.map(paymentFromApi);
}

export async function fetchPaymentsDashboard(params = {}) {
  const res = await apiClient.get("/payments/dashboard", { params });
  return res.data.data;
}

// Late/overdue payments — used to power the "reminders" list, since the
// backend has no dedicated reminders endpoint.
export async function fetchLatePayments() {
  const res = await apiClient.get("/payments/late");
  const list = Array.isArray(res.data.data) ? res.data.data : res.data.data?.items || [];
  return list.map(paymentFromApi);
}

export async function schedulePayments(childId, months) {
  const res = await apiClient.post("/payments/schedule", paymentScheduleToApi(childId, months));
  return res.data.data;
}

export async function recordPayment(paymentId, form) {
  const res = await apiClient.patch(`/payments/${paymentId}`, paymentUpdateToApi(form));
  return paymentFromApi(res.data.data);
}

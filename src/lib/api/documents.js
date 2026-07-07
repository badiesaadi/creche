// src/lib/api/documents.js
//
// All of these generate a document server-side and (per the spec description
// "PDF URL returned") hand back a URL to it in `data`. We defensively read
// a few likely shapes (`data.url`, `data.fileUrl`, or `data` being the URL
// itself) since the spec doesn't pin down the exact field name.
import { apiClient } from "./client.js";

function extractUrl(data) {
  if (!data) return null;
  if (typeof data === "string") return data;
  return data.url || data.fileUrl || data.pdfUrl || null;
}

export async function generateContractDocument(contractId) {
  const res = await apiClient.post("/documents/contract", { contractId });
  return extractUrl(res.data.data);
}

export async function generateEnrollmentCertificate(childId) {
  const res = await apiClient.post("/documents/enrollment-certificate", { childId });
  return extractUrl(res.data.data);
}

export async function generatePayslipDocument(payslipId) {
  const res = await apiClient.post("/documents/payslip", { payslipId });
  return extractUrl(res.data.data);
}

export async function generateReportCard(childId, period) {
  const res = await apiClient.post("/documents/report-card", { childId, period });
  return extractUrl(res.data.data);
}

export async function generateWorkCertificate(employeeId) {
  const res = await apiClient.post("/documents/work-certificate", { employeeId });
  return extractUrl(res.data.data);
}

// folder: destination bucket/folder name on the backend (e.g. "documents", "logos")
export async function uploadDocument(folder, file) {
  const formData = new FormData();
  formData.append("file", file);
  const res = await apiClient.post(`/documents/upload/${folder}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return extractUrl(res.data.data) || res.data.data;
}

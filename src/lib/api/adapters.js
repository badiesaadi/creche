// src/lib/api/adapters.js
//
// The backend (Creche_Backend_API_openapi.json) uses English camelCase
// field names and UUIDs; every existing page/component in this app uses
// French field names (nom, prenom, adresse...) and mock numeric ids.
//
// Rather than rewriting every page, each adapter below converts:
//   toApi(...)   — frontend form state  -> backend request body
//   fromApi(...) — backend response     -> frontend-shaped object
//
// Pages keep using their existing French field names; only the
// api/*.js call sites (see src/lib/api/*.js) touch these adapters.

// ---------- Auth ----------
const ROLE_MAP = {
  ADMIN: "admin",
  RESPONSABLE: "manager", // backend calls managers "responsable"
  MANAGER: "manager",
  TEACHER: "teacher",
  ENSEIGNANTE: "teacher", // backend's actual value for teachers
  ENSEIGNANT: "teacher", // masculine form, in case it's used too
  EDUCATRICE: "teacher",
};

export function userFromApi(apiUser) {
  const rawRole = apiUser.role?.toUpperCase();
  return {
    id: apiUser.id,
    nom: apiUser.name,
    email: apiUser.email,
    role: ROLE_MAP[rawRole] ?? apiUser.role?.toLowerCase(),
    crecheId: apiUser.crecheId ?? null,
  };
}

// ---------- Crèches ----------
export function crecheToApi(form) {
  return {
    name: form.nom,
    address: form.adresse,
    phone: form.telephone,
    logo: form.logoUrl || undefined,
    // Only required when creating a NEW manager account alongside the creche.
    // Omit entirely on edit, or when assigning an existing manager instead.
    ...(form.responsable
      ? {
          responsable: {
            name: form.responsable.nom,
            email: form.responsable.email,
            password: form.responsable.password,
            phone: form.responsable.telephone,
          },
        }
      : {}),
  };
}

export function crecheFromApi(raw) {
  // POST /creches returns { creche: {...}, responsable: {...} } (nested).
  // GET /creches (list/single) may return the creche record directly,
  // possibly with responsable nested inside it instead. Handle both.
  const apiCreche = raw.creche || raw;
  const responsable = raw.responsable || apiCreche.responsable || apiCreche.manager;

  return {
    id: apiCreche.id,
    nom: apiCreche.name,
    adresse: apiCreche.address,
    telephone: apiCreche.phone,
    logoUrl: apiCreche.logo || "",
    statut: apiCreche.isActive === false ? "inactive" : "active",
    manager: responsable?.name || "—",
    managerId: responsable?.id || null,
    enfantsCount: apiCreche.childrenCount ?? 0,
    employesCount: apiCreche.employeesCount ?? 0,
    // Not part of the backend Creche model yet — kept client-side only.
    capacite: apiCreche.capacite ?? "",
    tarifMensuel: apiCreche.tarifMensuel ?? 0,
  };
}

// ---------- Employees ----------
export function employeeToApi(form) {
  const [firstName, ...rest] = form.nom.trim().split(" ");
  return {
    firstName,
    lastName: rest.join(" ") || firstName,
    phone: form.telephone,
    email: form.email,
    password: form.password,
    specialty: form.specialite || undefined,
    contract: {
      type: form.contratType, // "CDI" | "CDD"
      position: form.poste,
      baseSalary: Number(form.salaire),
      startDate: form.dateDebut,
      ...(form.dateFin ? { endDate: form.dateFin } : {}),
    },
  };
}

// PATCH /employees/{id} only accepts these fields per the backend spec —
// salary/contract/position changes go through addContract() instead.
export function employeeUpdateToApi(form) {
  const [firstName, ...rest] = form.nom.trim().split(" ");
  return {
    firstName,
    lastName: rest.join(" ") || firstName,
    phone: form.telephone,
    email: form.email,
    specialty: form.specialite || undefined,
  };
}

export function employeeFromApi(apiEmp) {
  return {
    id: apiEmp.id,
    nom: `${apiEmp.firstName} ${apiEmp.lastName}`,
    email: apiEmp.email,
    telephone: apiEmp.phone,
    poste: apiEmp.contract?.position,
    salaire: apiEmp.contract?.baseSalary,
    dateEmbauche: apiEmp.contract?.startDate,
    dateFinContrat: apiEmp.contract?.endDate || null,
    contratType: apiEmp.contract?.type,
    specialite: apiEmp.specialty,
    statut: apiEmp.active === false ? "inactif" : "actif",
    creche: apiEmp.creche?.name,
    crecheId: apiEmp.creche?.id,
  };
}

export function contractToApi(form) {
  return {
    type: form.type,
    position: form.poste,
    baseSalary: Number(form.salaire),
    startDate: form.dateDebut,
    ...(form.dateFin ? { endDate: form.dateFin } : {}),
  };
}

// ---------- Children ----------
export function childToApi(form) {
  return {
    firstName: form.prenom,
    lastName: form.nom,
    dateOfBirth: form.dateNaissance,
    gender: form.sexe === "F" ? "FEMALE" : "MALE",
    lunchOption: form.optionRepas === "creche" ? "CRECHE" : "HOME",
    groupId: form.groupId, // real backend group uuid, not the local class id
    parents: [
      {
        name: form.parentNom,
        phone: form.parentTelephone,
        address: form.adresse || undefined,
      },
    ],
  };
}

// PATCH /children/{id} only accepts these 3 fields per the backend spec —
// dateOfBirth, gender, groupId, and parents are NOT editable after enrollment.
export function childUpdateToApi(form) {
  return {
    firstName: form.prenom,
    lastName: form.nom,
    lunchOption: form.optionRepas === "creche" ? "CRECHE" : "HOME",
  };
}

export function childFromApi(apiChild) {
  return {
    id: apiChild.id,
    prenom: apiChild.firstName,
    nom: apiChild.lastName,
    dateNaissance: apiChild.dateOfBirth,
    sexe: apiChild.gender === "FEMALE" ? "F" : "M",
    optionRepas: apiChild.lunchOption === "CRECHE" ? "creche" : "maison",
    groupId: apiChild.groupId,
    statut: apiChild.active === false ? "retire" : "actif",
    parentNom: apiChild.parents?.[0]?.name,
    parentTelephone: apiChild.parents?.[0]?.phone,
    adresse: apiChild.parents?.[0]?.address,
    // Admin network views only: present when the endpoint nests creche info.
    creche: apiChild.creche?.name,
    crecheId: apiChild.creche?.id || apiChild.crecheId,
    dateInscription: apiChild.createdAt,
    // No dedicated insurance flag on the backend Child model — approximated
    // via a document entry named "Assurance" marked as provided, if present.
    assure: (apiChild.documents || []).some(
      (d) => /assurance/i.test(d.type || "") && d.isProvided
    ),
  };
}

// ---------- Classes & Groups ----------
export function classToApi(form) {
  return {
    name: form.nom,
    minAge: Number(form.ageMin),
    maxAge: Number(form.ageMax),
    maxCapacity: Number(form.seuilMax),
  };
}

export function classFromApi(apiClass) {
  return {
    id: apiClass.id,
    nom: apiClass.name,
    tranche: `${apiClass.minAge}-${apiClass.maxAge} ans`,
    seuilMax: apiClass.maxCapacity,
    // Present when the backend nests groups inside the class payload
    // (there's no separate "list groups for a class" endpoint in the spec).
    groups: (apiClass.groups || []).map(groupFromApi),
  };
}

export function groupToApi(form, classId) {
  return {
    name: form.name, // e.g. "Groupe B"
    maxCapacity: Number(form.maxCapacity),
    classId,
  };
}

export function groupFromApi(apiGroup) {
  return {
    id: apiGroup.id,
    nom: apiGroup.name,
    seuilMax: apiGroup.maxCapacity,
    classId: apiGroup.classId,
    enseignant: apiGroup.teacher?.name || null,
    enseignantId: apiGroup.teacher?.id || null,
    enfantIds: (apiGroup.children || []).map((c) => c.id),
  };
}

// ---------- Payments ----------
// NOTE: the backend has no "record a one-off payment" endpoint. Payments are
// pre-scheduled (POST /payments/schedule) then marked paid one at a time via
// PATCH /payments/{id}. RecordPaymentPage must first look up the *scheduled*
// payment id for the selected child + month before calling this.
// ---------- Charges (admin expenses) ----------
const chargeFrequencyMap = { mensuelle: "MONTHLY", trimestrielle: "QUARTERLY", annuelle: "ANNUAL" };
const chargeModeMap = { "Espèces": "ESPECES", "CIB": "CIB", "Chèque": "CHEQUE", "Virement": "ESPECES" };

export function chargeToApi(form) {
  const isRecurring = form.type === "recurrente";
  return {
    crecheId: form.crecheId,
    category: form.categorie,
    amount: Number(form.montant),
    date: form.date,
    paymentMode: chargeModeMap[form.mode] || "ESPECES",
    isRecurring,
    type: isRecurring ? (chargeFrequencyMap[form.frequence] || "MONTHLY") : "MONTHLY",
    ...(isRecurring ? { frequency: chargeFrequencyMap[form.frequence] || "MONTHLY" } : {}),
  };
}

export function chargeFromApi(apiCharge, crecheName) {
  const modeMap = { ESPECES: "Espèces", CIB: "CIB", CHEQUE: "Chèque" };
  const freqMap = { MONTHLY: "mensuelle", QUARTERLY: "trimestrielle", ANNUAL: "annuelle" };
  return {
    id: apiCharge.id,
    crecheId: apiCharge.crecheId,
    creche: crecheName || "",
    categorie: apiCharge.category,
    montant: apiCharge.amount,
    date: apiCharge.date,
    type: apiCharge.isRecurring ? "recurrente" : "ponctuelle",
    frequence: apiCharge.isRecurring ? (freqMap[apiCharge.frequency] || null) : null,
    mode: modeMap[apiCharge.paymentMode] || apiCharge.paymentMode,
    reference: apiCharge.reference || "",
  };
}

export function paymentUpdateToApi(form) {
  const modeMap = { "Espèces": "ESPECES", "Chèque": "CHEQUE", "CIB": "CIB" };
  return {
    amountPaid: Number(form.montant),
    mode: modeMap[form.methode] || "ESPECES", // backend has no bank-transfer option
    ...(form.methode === "Chèque" && form.reference ? { chequeRef: form.reference } : {}),
    ...(form.date ? { paidAt: form.date } : {}),
    ...(form.discount
      ? {
          discount: {
            type: form.discountType === "percentage" ? "PERCENTAGE" : "FIXED",
            value: Number(form.discount),
            reason: form.discountReason,
          },
        }
      : {}),
  };
}

export function paymentScheduleToApi(childId, months) {
  // months: [{ date: "2026-09", montant: 5000 }, ...] (frontend shape)
  return {
    childId,
    months: months.map((m) => ({
      dueDate: m.date,
      amountDue: Number(m.montant),
    })),
  };
}

// ---------- Notifications ----------
// Backend types (PAYMENT_LATE, ABSENCE_THRESHOLD, DOCUMENT_MISSING,
// CONTRACT_END, GENERAL) -> existing frontend types used by NotificationsBell.
const notificationTypeMap = {
  PAYMENT_LATE: "payment_overdue",
  ABSENCE_THRESHOLD: "absence_threshold",
  DOCUMENT_MISSING: "document_missing",
  CONTRACT_END: "contract_expiry",
  GENERAL: "reminder_sent",
};

const notificationLinkMap = {
  payment_overdue: "/creche/payments/rappels",
  absence_threshold: "/creche/enfants",
  document_missing: "/creche/enfants",
  contract_expiry: "/creche/hr",
  reminder_sent: "/creche/payments/rappels",
};

export function notificationFromApi(apiNotif) {
  const type = notificationTypeMap[apiNotif.type] || "reminder_sent";
  return {
    id: apiNotif.id,
    type,
    message: apiNotif.message || apiNotif.title,
    date: (apiNotif.createdAt || apiNotif.date || "").slice(0, 10),
    read: apiNotif.read ?? apiNotif.isRead ?? false,
    link: apiNotif.link || notificationLinkMap[type] || "/creche/notifications",
  };
}

export function paymentFromApi(apiPayment) {
  const modeMap = { ESPECES: "Espèces", CHEQUE: "Chèque", CIB: "CIB" };
  const statusMap = { PAYE: "paye", EN_RETARD: "en_retard", A_VENIR: "a_venir" };
  return {
    id: apiPayment.id,
    childId: apiPayment.childId,
    date: apiPayment.paidAt || apiPayment.dueDate,
    montant: apiPayment.amountPaid ?? apiPayment.amountDue,
    methode: modeMap[apiPayment.mode] || apiPayment.mode,
    statut: statusMap[apiPayment.status] || apiPayment.status,
  };
}
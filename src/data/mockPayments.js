export const mockPayments = [
  { id: 1, childId: 1, childName: "Yacine Ahmed", date: "2025-09-01", montant: 8000, statut: "paye", methode: "Espèces" },
  { id: 2, childId: 1, childName: "Yacine Ahmed", date: "2025-10-01", montant: 8000, statut: "paye", methode: "Espèces" },
  { id: 3, childId: 1, childName: "Yacine Ahmed", date: "2025-11-01", montant: 8000, statut: "en_retard", methode: "-" },
  { id: 4, childId: 2, childName: "Lina Belkacem", date: "2025-09-01", montant: 7500, statut: "paye", methode: "Virement" },
  { id: 5, childId: 2, childName: "Lina Belkacem", date: "2025-10-01", montant: 7500, statut: "paye", methode: "Virement" },
  { id: 6, childId: 3, childName: "Omar Cherif", date: "2025-11-01", montant: 7500, statut: "en_retard", methode: "-" },
];

export const mockReminders = [
  { id: 1, childId: 1, childName: "Yacine Ahmed", paymentId: 3, sentDate: "2025-11-05", status: "envoye" },
  { id: 2, childId: 3, childName: "Omar Cherif", paymentId: 6, sentDate: null, status: "non_envoye" },
];

export const mockPaymentSchedules = [
  {
    id: 1,
    childId: 1,
    childName: "Yacine Ahmed",
    schedules: [
      { month: "Septembre 2025", dueDate: "2025-09-01", montant: 8000, statut: "paye" },
      { month: "Octobre 2025", dueDate: "2025-10-01", montant: 8000, statut: "paye" },
      { month: "Novembre 2025", dueDate: "2025-11-01", montant: 8000, statut: "en_retard" },
      { month: "Décembre 2025", dueDate: "2025-12-01", montant: 8000, statut: "a_venir" },
      { month: "Janvier 2026", dueDate: "2026-01-01", montant: 8000, statut: "a_venir" },
    ],
  },
  {
    id: 2,
    childId: 2,
    childName: "Lina Belkacem",
    schedules: [
      { month: "Septembre 2025", dueDate: "2025-09-01", montant: 7500, statut: "paye" },
      { month: "Octobre 2025", dueDate: "2025-10-01", montant: 7500, statut: "paye" },
      { month: "Novembre 2025", dueDate: "2025-11-01", montant: 7500, statut: "a_venir" },
      { month: "Décembre 2025", dueDate: "2025-12-01", montant: 7500, statut: "a_venir" },
    ],
  },
];
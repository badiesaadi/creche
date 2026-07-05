export const mockCrecheNetwork = [
  {
    id: 1,
    nom: "Crèche PAI Mostaganem",
    adresse: "12 Rue des Fleurs, Mostaganem",
    statut: "active",
    enfantsCount: 42,
    employesCount: 8,
    tarifMensuel: 8000,
    manager: "Sara Mansouri",
    telephone: "045123456",
    tauxRemplissage: 84,
    revenueMonth: 336000,
    chargesMonth: 120000,
  },
  {
    id: 2,
    nom: "Crèche PAI Oran",
    adresse: "5 Bd de la République, Oran",
    statut: "active",
    enfantsCount: 35,
    employesCount: 6,
    tarifMensuel: 9000,
    manager: "Karim Bouzidi",
    telephone: "041987654",
    tauxRemplissage: 70,
    revenueMonth: 280000,
    chargesMonth: 95000,
  },
  {
    id: 3,
    nom: "Crèche PAI Relizane",
    adresse: "8 Rue Khemisti, Relizane",
    statut: "inactive",
    enfantsCount: 0,
    employesCount: 0,
    tarifMensuel: 7500,
    manager: "—",
    telephone: "046112233",
    tauxRemplissage: 0,
    revenueMonth: 0,
    chargesMonth: 5000,
  },
];

export const mockNetworkKPIs = {
  totalEnfants: 77,
  totalEmployes: 14,
  totalCrecheActives: 2,
  revenueThisMonth: 616000,
  pendingPayments: 3,
  absencesToday: 5,
};

export const mockGlobalHR = [
  { id: 1, nom: "Sara Mansouri", creche: "Mostaganem", crecheId: 1, poste: "Enseignante", salaire: 45000, statut: "actif", payslipStatut: "valide" },
  { id: 2, nom: "Amine Belkacem", creche: "Mostaganem", crecheId: 1, poste: "Enseignant", salaire: 45000, statut: "actif", payslipStatut: "en_attente" },
  { id: 3, nom: "Yasmine Cherif", creche: "Mostaganem", crecheId: 1, poste: "Assistante", salaire: 32000, statut: "conge", payslipStatut: "valide" },
  { id: 4, nom: "Karim Bouzidi", creche: "Oran", crecheId: 2, poste: "Manager", salaire: 60000, statut: "actif", payslipStatut: "en_attente" },
  { id: 5, nom: "Nadia Hamdi", creche: "Oran", crecheId: 2, poste: "Enseignante", salaire: 45000, statut: "actif", payslipStatut: "valide" },
];

export const mockGlobalFinance = [
  { id: 1, creche: "Mostaganem", mois: "Novembre 2025", collected: 336000, pending: 16000, expenses: 120000 },
  { id: 2, creche: "Oran", mois: "Novembre 2025", collected: 280000, pending: 18000, expenses: 95000 },
  { id: 3, creche: "Relizane", mois: "Novembre 2025", collected: 0, pending: 0, expenses: 5000 },
  { id: 4, creche: "Mostaganem", mois: "Octobre 2025", collected: 320000, pending: 24000, expenses: 118000 },
  { id: 5, creche: "Oran", mois: "Octobre 2025", collected: 270000, pending: 12000, expenses: 92000 },
];

export const mockExpenses = [
  { id: 1, crecheId: 1, creche: "Mostaganem", categorie: "Loyer", montant: 50000, date: "2025-11-01", type: "recurrente", frequence: "mensuelle", mode: "Virement", reference: "" },
  { id: 2, crecheId: 1, creche: "Mostaganem", categorie: "Eau/Électricité", montant: 15000, date: "2025-11-05", type: "recurrente", frequence: "mensuelle", mode: "CIB", reference: "" },
  { id: 3, crecheId: 2, creche: "Oran", categorie: "Loyer", montant: 45000, date: "2025-11-01", type: "recurrente", frequence: "mensuelle", mode: "Virement", reference: "" },
  { id: 4, crecheId: 1, creche: "Mostaganem", categorie: "Fournitures", montant: 8000, date: "2025-11-10", type: "ponctuelle", frequence: null, mode: "Espèces", reference: "" },
  { id: 5, crecheId: 2, creche: "Oran", categorie: "Maintenance", montant: 12000, date: "2025-11-12", type: "ponctuelle", frequence: null, mode: "Chèque", reference: "CHQ-2025-089" },
];

export const mockNetworkChildren = [
  { id: 1, nom: "Ahmed", prenom: "Yacine", creche: "Mostaganem", crecheId: 1, dateInscription: "2024-09-01", assure: true },
  { id: 2, nom: "Belkacem", prenom: "Lina", creche: "Mostaganem", crecheId: 1, dateInscription: "2024-09-03", assure: true },
  { id: 3, nom: "Cherif", prenom: "Omar", creche: "Mostaganem", crecheId: 1, dateInscription: "2025-01-10", assure: false },
  { id: 4, nom: "Bouzidi", prenom: "Amir", creche: "Oran", crecheId: 2, dateInscription: "2024-09-01", assure: true },
  { id: 5, nom: "Hamdi", prenom: "Rania", creche: "Oran", crecheId: 2, dateInscription: "2025-02-15", assure: false },
  { id: 6, nom: "Khelifi", prenom: "Samir", creche: "Oran", crecheId: 2, dateInscription: "2025-03-01", assure: false },
];

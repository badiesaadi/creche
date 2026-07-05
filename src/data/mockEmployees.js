export const mockEmployees = [
  {
    id: 1,
    nom: "Sara Mansouri",
    poste: "Enseignante",
    telephone: "0555112233",
    email: "sara.m@pai.dz",
    dateEmbauche: "2023-09-01",
    statut: "actif",
    salaireBase: 45000,
  },
  {
    id: 2,
    nom: "Amine Belkacem",
    poste: "Enseignant",
    telephone: "0661445566",
    email: "amine.b@pai.dz",
    dateEmbauche: "2024-02-15",
    statut: "actif",
    salaireBase: 45000,
  },
  {
    id: 3,
    nom: "Yasmine Cherif",
    poste: "Assistante",
    telephone: "0770998877",
    email: "yasmine.c@pai.dz",
    dateEmbauche: "2022-06-10",
    statut: "conge",
    salaireBase: 32000,
  },
];

export const mockContracts = {
  1: { type: "CDI", dateDebut: "2023-09-01", dateFin: null, salaire: 45000, document: "contrat_sara.pdf" },
  2: { type: "CDD", dateDebut: "2024-02-15", dateFin: "2026-02-14", salaire: 45000, document: "contrat_amine.pdf" },
  3: { type: "CDI", dateDebut: "2022-06-10", dateFin: null, salaire: 32000, document: "contrat_yasmine.pdf" },
};

export const mockStaffAbsences = [
  { id: 1, employeeId: 2, employeeName: "Amine Belkacem", date: "2025-11-04", motif: "Maladie", justifie: true },
  { id: 2, employeeId: 3, employeeName: "Yasmine Cherif", date: "2025-10-20", motif: "Congé maternité", justifie: true },
];

export const mockPayslips = [
  { id: 1, employeeId: 1, mois: "Octobre 2025", net: 41000, statut: "valide" },
  { id: 2, employeeId: 1, mois: "Novembre 2025", net: 41000, statut: "en_attente" },
  { id: 3, employeeId: 2, mois: "Novembre 2025", net: 41000, statut: "en_attente" },
];
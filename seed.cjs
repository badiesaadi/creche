/**
 * Full seed script for Gestion des Crèches PAI backend.
 *
 * What this does, in order:
 *  1. Logs in as an existing ADMIN account (must already exist — the backend
 *     has no public "create admin" endpoint).
 *  2. Creates 2 crèches. Each POST /creches call also creates that crèche's
 *     manager ("responsable") account in the same request — there is no
 *     separate "create manager" step, this IS it.
 *  3. Logs in as each new manager and creates: a class + group, a teacher,
 *     two children, a payment schedule, an absence, an evaluation, and a
 *     settings update — so you get a fuller dataset to click through.
 *
 * Usage:
 *   npm install
 *   node seed.js
 *
 * Edit the CONFIG block below first — especially ADMIN_EMAIL/ADMIN_PASSWORD.
 * Re-running this script creates a FRESH set of accounts each time (emails
 * are timestamped below) so it won't collide with a previous run.
 */

const axios = require("axios");

const CONFIG = {
  API_URL: "https://creche-backend-latest.onrender.com/api", // confirmed working prefix
  ADMIN_EMAIL: "admin@creche.dz",     // <-- replace with the real admin account
  ADMIN_PASSWORD: "admin123",           // <-- replace with the real admin password
};

const api = axios.create({ baseURL: CONFIG.API_URL, timeout: 30000 });
const stamp = Date.now().toString().slice(-6); // keeps emails unique across runs

function withToken(token) {
  return { headers: { Authorization: `Bearer ${token}` } };
}

async function login(email, password) {
  const res = await api.post("/auth/login", { email, password });
  return res.data.data; // { accessToken, user }
}

async function seedCreche(adminToken, index) {
  const payload = {
    name: `Crèche Seed ${index} (${stamp})`,
    address: "Mostaganem, Algérie",
    phone: `05500000${index}${stamp.slice(-2)}`,
    responsable: {
      name: `Manager ${index}`,
      email: `manager${index}.${stamp}@creche.dz`,
      password: "Password123!",
      phone: `05500001${index}${stamp.slice(-2)}`,
    },
  };

  console.log(`\n=== Crèche ${index}: ${payload.name} ===`);
  console.log(`→ Creating crèche + manager (${payload.responsable.email})...`);
  const crecheRes = await api.post("/creches", payload, withToken(adminToken));
  const rawCreche = crecheRes.data.data;
  // Defensive: some backends nest the created record differently
  // (e.g. { creche: {...} } or Mongo-style _id). We'll know for sure
  // once debug_creche.js output comes back — this just avoids a hard crash.
  const creche = {
    id: rawCreche.id || rawCreche._id || rawCreche.creche?.id || rawCreche.creche?._id,
    name: rawCreche.name || rawCreche.creche?.name || payload.name,
  };
  console.log(`✓ Crèche created: ${creche.id || "(id not found in response — see debug_creche.js)"}`);

  console.log(`→ Logging in as manager ${payload.responsable.email}...`);
  const { accessToken: managerToken } = await login(payload.responsable.email, payload.responsable.password);
  const authed = withToken(managerToken);
  console.log("✓ Manager logged in.");

  // --- Class + group ---
  console.log("→ Creating class + group...");
  const classRes = await api.post(
    "/classes",
    { name: "Petite Section", minAge: 1, maxAge: 2, maxCapacity: 15 },
    authed
  );
  const classId = classRes.data.data.id;
  const groupRes = await api.post(
    "/groups",
    { name: "Groupe A", maxCapacity: 15, classId },
    authed
  );
  const groupId = groupRes.data.data.id;
  console.log(`✓ Class ${classId} / Group ${groupId}`);

  // --- Teacher ---
  console.log("→ Creating a teacher...");
  const empRes = await api.post(
    "/employees",
    {
      firstName: "Fatima",
      lastName: `Zohra ${index}`,
      email: `teacher${index}.${stamp}@creche.dz`,
      password: "Password123!",
      phone: `05500002${index}${stamp.slice(-2)}`,
      specialty: "Éducatrice",
      contract: {
        type: "CDI",
        position: "Éducatrice",
        baseSalary: 35000,
        startDate: new Date().toISOString().slice(0, 10),
      },
    },
    authed
  );
  const employeeId = empRes.data.data.id;
  console.log(`✓ Teacher ${employeeId}`);

  await api.patch(`/groups/${groupId}/teacher`, { employeeId }, authed).catch((e) =>
    console.log(`  (skipped assigning teacher to group: ${e.response?.data?.message || e.message})`)
  );

  const teacherEmail = `teacher${index}.${stamp}@creche.dz`;
  console.log(`→ Logging in as teacher ${teacherEmail}...`);
  const { accessToken: teacherToken } = await login(teacherEmail, "Password123!");
  const authedAsTeacher = withToken(teacherToken);
  console.log("✓ Teacher logged in.");

  // --- Children ---
  console.log("→ Creating children...");
  const children = [
    { firstName: "Yasmine", lastName: "Amrani", dateOfBirth: "2022-03-14", gender: "FEMALE" },
    { firstName: "Adam", lastName: "Bekkar", dateOfBirth: "2022-07-02", gender: "MALE" },
  ];
  const childIds = [];
  for (const child of children) {
    const res = await api.post(
      "/children",
      {
        ...child,
        lunchOption: "CRECHE",
        groupId,
        parents: [{ name: "Parent Test", phone: "0550000000" }],
      },
      authed
    );
    childIds.push(res.data.data.id);
  }
  console.log(`✓ ${childIds.length} children added.`);

  // --- Payment schedule (needs an ARRAY of months, not a count) ---
  console.log("→ Scheduling payments for first child...");
  const today = new Date();
  const monthsArray = [0, 1, 2].map((offset) => {
    const d = new Date(today.getFullYear(), today.getMonth() + offset, 5);
    return { dueDate: d.toISOString().slice(0, 10), amountDue: 8000 };
  });
  await api
    .post("/payments/schedule", { childId: childIds[0], months: monthsArray }, authed)
    .then(() => console.log("✓ Payment schedule created."))
    .catch((e) => console.log(`  (skipped: ${e.response?.data?.message || e.message})`));

  // --- Absence (teacher-only action) ---
  console.log("→ Recording an absence (as teacher)...");
  await api
    .post("/absences", { childId: childIds[0], date: new Date().toISOString().slice(0, 10) }, authedAsTeacher)
    .then(() => console.log("✓ Absence recorded."))
    .catch((e) => console.log(`  (skipped: ${e.response?.data?.message || e.message})`));

  // --- Evaluation (teacher-only action) ---
  console.log("→ Adding an evaluation (as teacher)...");
  await api
    .post(
      "/evaluations",
      { childId: childIds[0], period: "T1", criteria: "Motricité", score: "Bon", comment: "Progrès notable" },
      authedAsTeacher
    )
    .then(() => console.log("✓ Evaluation added."))
    .catch((e) => console.log(`  (skipped: ${e.response?.data?.message || e.message})`));

  // --- Settings ---
  console.log("→ Updating crèche settings...");
  await api
    .patch(
      "/settings",
      {
        registrationFee: 5000,
        monthlyFee: 8000,
        groupSizeThreshold: 15,
        absenceThreshold: 3,
        paymentReminderDays: 5,
        evalPeriodType: "TRIMESTRE",
      },
      authed
    )
    .then(() => console.log("✓ Settings updated."))
    .catch((e) => console.log(`  (skipped: ${e.response?.data?.message || e.message})`));

  return { creche, manager: payload.responsable, employeeEmail: empRes.data.data.email || `teacher${index}.${stamp}@creche.dz` };
}

async function main() {
  console.log(`→ Connecting to ${CONFIG.API_URL}`);
  console.log("→ Logging in as admin...");
  const { accessToken: adminToken } = await login(CONFIG.ADMIN_EMAIL, CONFIG.ADMIN_PASSWORD);
  console.log("✓ Admin logged in.");

  const results = [];
  for (const i of [1, 2]) {
    const result = await seedCreche(adminToken, i);
    results.push(result);
  }

  console.log("\n================ SUMMARY ================");
  for (const r of results) {
    console.log(`\nCrèche: ${r.creche.name} (${r.creche.id})`);
    console.log(`  Manager login: ${r.manager.email} / ${r.manager.password}`);
    console.log(`  Teacher login: ${r.employeeEmail} / Password123!`);
  }
  console.log("\nLog into the frontend with any manager login above.");
}

main().catch((err) => {
  console.error("\n✗ Seed failed:", err.response?.data || err.message);
  process.exit(1);
});

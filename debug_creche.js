const axios = require("axios");

const API_URL = "https://creche-backend-latest.onrender.com/api";
const ADMIN_EMAIL = "admin@creche.dz";   // <-- your real admin email
const ADMIN_PASSWORD = "admin123";          // <-- your real admin password

const api = axios.create({ baseURL: API_URL, timeout: 30000 });

async function main() {
  const loginRes = await api.post("/auth/login", { email: ADMIN_EMAIL, password: ADMIN_PASSWORD });
  const token = loginRes.data.data.accessToken;

  const stamp = Date.now().toString().slice(-6);
  const res = await api.post(
    "/creches",
    {
      name: `Debug Creche ${stamp}`,
      address: "Mostaganem",
      phone: `05500009${stamp.slice(-2)}`,
      responsable: {
        name: "Debug Manager",
        email: `debugmgr.${stamp}@creche.dz`,
        password: "Password123!",
        phone: `05500008${stamp.slice(-2)}`,
      },
    },
    { headers: { Authorization: `Bearer ${token}` } }
  );

  console.log("FULL RESPONSE BODY:");
  console.log(JSON.stringify(res.data, null, 2));
}

main().catch((err) => {
  console.error("Failed:", JSON.stringify(err.response?.data || err.message, null, 2));
});

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { login as loginApi } from "../../lib/api/auth.js";
import { useAuth } from "../../lib/auth/AuthContext.jsx";

export default function LoginPage() {
  const { t ,i18n } = useTranslation();
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
  e.preventDefault();
  setError("");
  setLoading(true);

  try {
    const { user, accessToken, refreshToken } = await loginApi(email, password);
    login(user, accessToken, refreshToken);
    if (user.role === "admin") navigate("/admin/dashboard");
    else navigate("/creche/dashboard");
  } catch (err) {
    setError(err.response?.data?.message || t("common.error"));
  } finally {
    setLoading(false);
  }
}

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm bg-white p-8 rounded-xl shadow-md space-y-5"
      >
        <h1 className="text-2xl font-bold text-center text-gray-800">
          {t("auth.login")}
        </h1>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-2">
            {error}
          </p>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t("auth.email")}
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t("auth.password")}
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-teal-600 text-white rounded-md py-2 font-medium hover:bg-teal-700 disabled:opacity-50"
        >
          {loading ? t("common.loading") : t("auth.submit")}
        </button>
        {/* Language switcher */}
<div className="flex justify-center gap-1 pt-2">
  {["ar", "fr", "en"].map((lang) => (
    <button
      key={lang}
      type="button"
      onClick={() => i18n.changeLanguage(lang)}
      className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
        i18n.language === lang
          ? "bg-teal-600 text-white"
          : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"
      }`}
    >
      {lang.toUpperCase()}
    </button>
  ))}
</div>
      </form>

      
    </div>

    
  );
}



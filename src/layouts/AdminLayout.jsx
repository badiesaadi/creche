import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../lib/auth/AuthContext.jsx";
import NotificationsBell from "../components/shared/NotificationsBell.jsx";

const navItems = [
  { to: "/admin/dashboard", labelKey: "nav.dashboard" },
  { to: "/admin/creches", labelKey: "nav.creches" },
  { to: "/admin/children", labelKey: "admin.childrenNetwork" },
  { to: "/admin/hr", labelKey: "nav.hr" },
  { to: "/admin/finance", labelKey: "nav.finance" },
  { to: "/admin/expenses", labelKey: "admin.expenses" },
  { to: "/admin/reports", labelKey: "nav.reports" },
];

export default function AdminLayout() {
  const { t, i18n } = useTranslation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  function handleLogout() {
    logout();
    navigate("/login");
  }

  function handleNavClick() {
    setMobileOpen(false);
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar — same light design as CrecheLayout */}
      <aside
        className={`fixed md:static z-40 top-0 h-full w-64 bg-white border-e border-gray-200 flex flex-col transition-transform duration-200
          ${mobileOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0`}
      >
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="font-bold text-teal-700 text-lg">PAI — Admin</h2>
            <p className="text-xs text-gray-500">{user?.nom}</p>
          </div>
          <button
            className="md:hidden text-gray-500"
            onClick={() => setMobileOpen(false)}
          >
            &#x2715;
          </button>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={handleNavClick}
              className={({ isActive }) =>
                `block px-3 py-2 rounded-md text-sm font-medium ${
                  isActive
                    ? "bg-teal-50 text-teal-700"
                    : "text-gray-600 hover:bg-gray-100"
                }`
              }
            >
              {t(item.labelKey)}
            </NavLink>
          ))}
        </nav>

        <div className="p-3 border-t border-gray-200 space-y-2">
          <div className="flex gap-1 text-xs">
            {["ar", "fr", "en"].map((lang) => (
              <button
                key={lang}
                onClick={() => i18n.changeLanguage(lang)}
                className={`flex-1 py-1 rounded text-xs font-medium ${
                  i18n.language === lang
                    ? "bg-teal-600 text-white"
                    : "text-gray-500 hover:bg-gray-100"
                }`}
              >
                {lang.toUpperCase()}
              </button>
            ))}
          </div>
          <button
            onClick={handleLogout}
            className="w-full text-sm text-red-600 hover:bg-red-50 rounded-md px-3 py-2 text-start"
          >
            {t("auth.logout")}
          </button>
        </div>
      </aside>

      {/* Main column */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile topbar */}
        <div className="md:hidden flex items-center justify-between bg-white border-b border-gray-200 p-3">
          <button onClick={() => setMobileOpen(true)} className="text-gray-700 text-xl leading-none">
            &#9776;
          </button>
          <span className="font-bold text-teal-700">PAI — Admin</span>
          <NotificationsBell />
        </div>

        {/* Desktop topbar */}
        <div className="hidden md:flex items-center justify-end bg-white border-b border-gray-200 px-6 py-2">
          <NotificationsBell />
        </div>

        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

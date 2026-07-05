import { useState } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../lib/auth/AuthContext.jsx";
import NotificationsBell from "../components/shared/NotificationsBell.jsx";


const navItemsByRole = {
  manager: [
    { to: "/creche/dashboard", key: "nav.dashboard" },
    { to: "/creche/enfants", key: "nav.children" },
    { to: "/creche/classes", key: "nav.classes" },
    { to: "/creche/payments", key: "nav.payments" },
    { to: "/creche/hr", key: "nav.hr" },
    { to: "/creche/settings", key: "nav.settings" },
  ],
  teacher: [
    { to: "/creche/dashboard", key: "nav.dashboard" },
    { to: "/creche/enfants", key: "nav.children" },
    { to: "/creche/classes", key: "nav.classes" },
  ],
};

export default function CrecheLayout() {
  const { t, i18n } = useTranslation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = navItemsByRole[user?.role] || [];

  function handleLogout() {
    logout();
    navigate("/login");
  }

  function handleNavClick() {
    setMobileOpen(false); // close drawer after navigating on mobile
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

      {/* Sidebar */}
      <aside
        className={`fixed md:static z-40 top-0 h-full w-64 bg-white border-e border-gray-200 flex flex-col transition-transform duration-200
          ${mobileOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0`}
      >
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="font-bold text-teal-700 text-lg">Gestion PAI</h2>
            <p className="text-xs text-gray-500">{user?.nom}</p>
          </div>
          <button
            className="md:hidden text-gray-500"
            onClick={() => setMobileOpen(false)}
          >
            &#x2715;
          </button>
        </div>

        <nav className="flex-1 p-3 space-y-1">
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
              {t(item.key)}
            </NavLink>
          ))}
        </nav>

        <div className="p-3 border-t border-gray-200 space-y-2">
          <div className="flex gap-1 text-xs">
            <button onClick={() => i18n.changeLanguage("ar")} className="px-2 py-1 rounded hover:bg-gray-100">ع</button>
            <button onClick={() => i18n.changeLanguage("fr")} className="px-2 py-1 rounded hover:bg-gray-100">FR</button>
            <button onClick={() => i18n.changeLanguage("en")} className="px-2 py-1 rounded hover:bg-gray-100">EN</button>
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
          <button onClick={() => setMobileOpen(true)} className="text-gray-700">
              &#9776;
         </button>
         <span className="font-bold text-teal-700">Gestion PAI</span>
         <NotificationsBell />
        </div>
            {/* Desktop topbar */}
       <div className="hidden md:flex items-center justify-end bg-white border-b border-gray-200 px-6 py-2">
        <NotificationsBell />
        </div>
        <main className="flex-1 p-6 overflow-y-auto ">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";
import { usePlatform } from "../context/PlatformContext";
import { useState, useEffect } from "react";

function normalizeTheme(val) {
  if (!val) return "white";
  const lower = String(val).toLowerCase().trim();
  if (lower === "dark") return "black";
  if (lower === "light") return "white";
  if (lower === "black" || lower === "blue" || lower === "white") return lower;
  return "white";
}

export default function Layout() {
  const { apiError, apiLoading, refreshData } = usePlatform();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(window.innerWidth <= 720);
  const [theme, setTheme] = useState(() => {
    const stored = localStorage.getItem("crm-theme") || document.documentElement.getAttribute("data-theme");
    return normalizeTheme(stored);
  });

  useEffect(() => {
    const apply = (val) => {
      const norm = normalizeTheme(val);
      document.documentElement.setAttribute("data-theme", norm);
      document.body.className = `theme-${norm}`;
      localStorage.setItem("crm-theme", norm);
    };
    apply(theme);

    const handleCustomChange = (e) => {
      if (e.detail && e.detail !== theme) {
        setTheme(normalizeTheme(e.detail));
      }
    };
    const handleStorageChange = (e) => {
      if (e.key === "crm-theme" && e.newValue && e.newValue !== theme) {
        setTheme(normalizeTheme(e.newValue));
      }
    };

    window.addEventListener("crm-theme-changed", handleCustomChange);
    window.addEventListener("storage", handleStorageChange);
    return () => {
      window.removeEventListener("crm-theme-changed", handleCustomChange);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [theme]);

  return (
    <div className={`app ${sidebarCollapsed ? "sidebar-collapsed" : ""}`} data-theme={theme}>
      <Sidebar />
      <div className="main">
        <Header
          sidebarCollapsed={sidebarCollapsed}
          onToggleSidebar={() => setSidebarCollapsed((collapsed) => !collapsed)}
        />
        <main className="content">
          {apiLoading && <div className="form-note">Connecting to Super Admin API…</div>}
          {apiError && (
            <div role="alert" className="form-note" style={{ borderColor: "#d14343", color: "#a12626", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
              <span>Super Admin API: {apiError}</span>
              <button className="secondary-button" disabled={apiLoading} onClick={refreshData}>
                {apiLoading ? "Retrying…" : "Retry"}
              </button>
            </div>
          )}
          <Outlet />
        </main>
      </div>
    </div>
  );
}

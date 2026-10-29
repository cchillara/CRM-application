import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";
import { usePlatform } from "../context/PlatformContext";
import { useState } from "react";

export default function Layout() {
  const { apiError, apiLoading, refreshData } = usePlatform();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(window.innerWidth <= 720);
  const [theme, setTheme] = useState(() => localStorage.getItem("shnoorAdminTheme") === "dark" ? "dark" : "light");

  function toggleTheme() {
    setTheme((currentTheme) => {
      const nextTheme = currentTheme === "dark" ? "light" : "dark";
      localStorage.setItem("shnoorAdminTheme", nextTheme);
      return nextTheme;
    });
  }

  return (
    <div className={`app ${sidebarCollapsed ? "sidebar-collapsed" : ""}`} data-theme={theme}>
      <Sidebar />
      <div className="main">
        <Header
          sidebarCollapsed={sidebarCollapsed}
          onToggleSidebar={() => setSidebarCollapsed((collapsed) => !collapsed)}
          theme={theme}
          onToggleTheme={toggleTheme}
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

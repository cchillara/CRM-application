import { useNavigate } from "react-router-dom";
import { CircleUserRound, LogOut, Menu, Moon, Sun } from "lucide-react";
import { logoutSuperAdmin } from "../api/superAdminApi";

export default function Header({ sidebarCollapsed, onToggleSidebar, theme, onToggleTheme }) {
  const navigate = useNavigate();

  async function logout() {
    try {
      await logoutSuperAdmin();
    } catch (error) {
      console.warn("Super Admin logout could not clear the server session:", error.message);
    }
    sessionStorage.clear();
    window.location.replace(import.meta.env.VITE_LOGIN_URL || "/login");
  }

  return (
    <header className="header">
      <div className="header-title-group">
        <button
          type="button"
          className="header-sidebar-toggle"
          onClick={onToggleSidebar}
          aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <Menu size={20} />
        </button>
        <div>
          <h1>SHNOOR CRM</h1>
        </div>
      </div>
      <div className="header-actions">
        <button
          type="button"
          className="header-theme-toggle"
          onClick={onToggleTheme}
          aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
          title={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
        >
          {theme === "dark" ? <Sun size={19} /> : <Moon size={19} />}
        </button>
        <div className="header-account">
          <button type="button" className="header-user-button" aria-label="Open account page" onClick={() => navigate("/account")}>
            <CircleUserRound size={20} />
          </button>
        </div>
        <button className="logout-button" onClick={logout}>
          <LogOut size={15} /> Log out
        </button>
      </div>
    </header>
  );
}

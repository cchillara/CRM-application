import { useNavigate } from "react-router-dom";
import { CircleUserRound, LogOut, Menu } from "lucide-react";
import { logoutSuperAdmin } from "../api/superAdminApi";
import ToggleTheme from "./ThemeToggle";

export default function Header({ sidebarCollapsed, onToggleSidebar }) {
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
        <ToggleTheme />
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

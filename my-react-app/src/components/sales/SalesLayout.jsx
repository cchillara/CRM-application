import { Outlet, useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import { SalesDataProvider } from "./SalesDataContext.jsx";
import { User, LogOut } from "lucide-react";
import { auth } from "../../firebase.js";
import { signOut } from "firebase/auth";
import "./SalesLayout.css";

function SalesLayout({ children }) {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/login");
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  return (
    <SalesDataProvider>
      <div className="sales-layout">
        <Sidebar />

        <div className="sales-layout-main">
          <header className="crm-top-header-bar">
            <div className="crm-top-header-left"></div>

            <div className="crm-top-header-actions">
              <button
                type="button"
                className="crm-header-icon-btn"
                title="Profile"
                aria-label="Profile"
                onClick={() => navigate("/profile")}
              >
                <User size={18} />
              </button>

              <button
                type="button"
                className="crm-header-logout-btn"
                onClick={handleLogout}
                title="Log out"
                aria-label="Log out"
              >
                <LogOut size={16} />
                <span>Log out</span>
              </button>
            </div>
          </header>

          <main className="sales-layout-content">
            {children || <Outlet />}
          </main>
        </div>
      </div>
    </SalesDataProvider>
  );
}

export default SalesLayout;

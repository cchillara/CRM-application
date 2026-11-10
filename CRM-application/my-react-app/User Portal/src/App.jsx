import { Activity, CalendarDays } from "lucide-react";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import { usePortal } from "./context/PortalContext";
import { pageMeta } from "./data/navigation";
import AccountPage from "./pages/AccountPage";
import CalendarPage from "./pages/CalendarPage";
import Dashboard from "./pages/Dashboard";
import SettingsPage from "./pages/SettingsPage";
import WorkspacePage from "./pages/WorkspacePage";

export default function App() {
  const { page, navigate, collapsed, theme, account, setAccount } = usePortal();
  const [description, Icon] = pageMeta[page] || ["Manage your CRM workspace.", Activity];

  return <div className={`portal app ${collapsed ? "sidebar-collapsed" : ""}`} data-theme={theme}>
    <Sidebar />
    <div className="main">
      <Header />
      <main className="content">
        <div className="page-title-row"><div><h1>{page}</h1></div><div className="today-pill"><CalendarDays size={15} /> Nov 5, 2026</div></div>
        {page === "Dashboard" ? <Dashboard onNavigate={navigate} />
          : page === "Account" ? <AccountPage account={account} setAccount={setAccount} />
          : page === "Settings" ? <SettingsPage />
          : page === "Calendar" ? <CalendarPage />
          : <WorkspacePage title={page} description={description} icon={Icon} />}
      </main>
    </div>
  </div>;
}

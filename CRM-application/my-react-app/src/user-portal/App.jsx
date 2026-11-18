import { Activity } from "lucide-react";
import UserPortalShell from "./components/UserPortalShell.jsx";
import { usePortal } from "./context/PortalContext";
import { pageMeta } from "./data/navigation";
import AccountPage from "./pages/AccountPage";
import CalendarPage from "./pages/CalendarPage";
import Dashboard from "./pages/Dashboard";
import SettingsPage from "./pages/SettingsPage";
import WorkspacePage from "./pages/WorkspacePage";

export default function App() {
  const { page, navigate, account, setAccount } = usePortal();
  const [description, Icon] = pageMeta[page] || ["Manage your CRM workspace.", Activity];

  const accountDescription = page === "Account" ? "Manage your profile and account security." : description;
  return <UserPortalShell title={page} description={accountDescription} showHeading={page !== "Calendar"}>
    {page === "Dashboard" ? <Dashboard onNavigate={navigate} />
      : page === "Account" ? <AccountPage account={account} setAccount={setAccount} />
      : page === "Settings" ? <SettingsPage />
      : page === "Calendar" ? <CalendarPage />
      : <WorkspacePage title={page} description={description} icon={Icon} />}
  </UserPortalShell>;
}

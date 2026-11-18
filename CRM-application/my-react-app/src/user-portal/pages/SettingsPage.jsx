import { useState } from "react";
import { Bell, UserRound } from "lucide-react";
import { usePortal } from "../context/PortalContext.jsx";

export default function SettingsPage() {
  const { account, navigate } = usePortal();
  const [emailAlerts, setEmailAlerts] = useState(() => localStorage.getItem("user-portal-email-alerts") !== "false");

  function toggleEmailAlerts() {
    setEmailAlerts((current) => {
      const next = !current;
      localStorage.setItem("user-portal-email-alerts", String(next));
      return next;
    });
  }

  return <div className="crm-dashboard settings-page user-settings-page">
    <section className="panel user-settings-panel">
      <div className="panel-title"><div><h3>Notifications</h3><p>Manage reminders for activity assigned to your account.</p></div></div>
      <label className="setting-row"><div><strong>Email alerts</strong><span>Receive email reminders about CRM activity and upcoming tasks.</span></div><input type="checkbox" checked={emailAlerts} onChange={toggleEmailAlerts} /></label>
      <button type="button" className="setting-row user-settings-link" onClick={() => navigate("Notifications")}><div><strong>In-app notifications</strong><span>View updates for your leads, deals, and tasks.</span></div><Bell size={18} /></button>
    </section>

    <section className="panel user-settings-panel">
      <div className="panel-title"><div><h3>Account and security</h3><p>Review your sign-in and personal details.</p></div></div>
      <button type="button" className="setting-row user-settings-link" onClick={() => navigate("Account")}><div><strong>{account.name || "Your account"}</strong><span>{account.email || "Manage your profile and password."}</span></div><UserRound size={18} /></button>
    </section>
  </div>;
}

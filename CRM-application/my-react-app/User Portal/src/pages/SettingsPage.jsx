import { useEffect, useState } from "react";
import { CheckCircle2, Save, Settings as SettingsIcon, SlidersHorizontal } from "lucide-react";
import { getSettings, updateSettings } from "../../../src/client-admin-portal/Api/Settings";

const defaults = {
  platformName: "SHNOOR CRM", supportEmail: "support@shnoor.com",
  allowSignup: true, emailAlerts: true, maintenanceMode: false
};

export default function SettingsPage() {
  const [settings, setSettings] = useState(defaults);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    getSettings().then((data) => {
      if (active && data) setSettings((current) => ({
        ...current,
        platformName: data.platformName || current.platformName,
        supportEmail: data.supportEmail || current.supportEmail,
        allowSignup: data.allowSignup ?? current.allowSignup,
        emailAlerts: data.emailAlerts ?? current.emailAlerts,
        maintenanceMode: data.maintenanceMode ?? current.maintenanceMode
      }));
    }).catch(() => {});
    return () => { active = false; };
  }, []);

  async function submit(event) {
    event.preventDefault();
    setSaving(true); setSaved(false); setError("");
    try {
      await updateSettings(settings);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (requestError) {
      setError(requestError.message || "Could not save settings. Please try again.");
    } finally { setSaving(false); }
  }

  function toggle(key) { setSettings((current) => ({ ...current, [key]: !current[key] })); }

  return <form className="settings-form-user" onSubmit={submit}>
    {error && <div className="settings-error" role="alert">{error}</div>}
    <section className="panel settings-user-panel"><div className="panel-heading"><div><h3><SettingsIcon size={16} /> General Settings</h3><p>Basic workspace and support details.</p></div></div><div className="account-form-grid"><label>Workspace name<input value={settings.platformName} onChange={(event) => setSettings({ ...settings, platformName: event.target.value })} /></label><label>Support email<input type="email" value={settings.supportEmail} onChange={(event) => setSettings({ ...settings, supportEmail: event.target.value })} /></label></div></section>
    <section className="panel settings-user-panel"><div className="panel-heading"><div><h3><SlidersHorizontal size={16} /> Workspace Options</h3><p>Manage workspace notifications and access options.</p></div></div>
      <SettingToggle title="Allow organization signup" detail="Allow new companies to create an organization account." checked={settings.allowSignup} onChange={() => toggle("allowSignup")} />
      <SettingToggle title="Email alerts" detail="Receive automated billing and support alert notifications." checked={settings.emailAlerts} onChange={() => toggle("emailAlerts")} />
      <SettingToggle title="Maintenance mode" detail="Temporarily suspend standard organization access." checked={settings.maintenanceMode} onChange={() => toggle("maintenanceMode")} />
    </section>
    <div className="account-form-actions settings-save-actions">{saved && <span className="form-success"><CheckCircle2 size={15} /> Settings saved successfully</span>}<button className="primary-button" disabled={saving}><Save size={15} />{saving ? "Saving…" : "Save Settings"}</button></div>
  </form>;
}

function SettingToggle({ title, detail, checked, onChange }) {
  return <label className="settings-toggle-row"><span><strong>{title}</strong><span>{detail}</span></span><input type="checkbox" checked={checked} onChange={onChange} /></label>;
}

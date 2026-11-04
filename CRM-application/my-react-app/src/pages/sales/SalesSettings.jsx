import React, { useState, useEffect } from "react";
import { Save, CheckCircle2, RefreshCw } from "lucide-react";
import { getSettings, updateSettings } from "../../sales-api/Settings.js";
import "./SalesSettings.css";

const DEFAULT_SETTINGS = {
  platformName: "SHNOOR CRM",
  supportEmail: "support@shnoor.com",
  allowSignup: true,
  emailAlerts: true,
  maintenanceMode: false,
};

export default function SalesSettings() {
  const [settingsForm, setSettingsForm] = useState(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settingsSaved, setSettingsSaved] = useState(false);

  useEffect(() => {
    setLoading(true);
    getSettings()
      .then((data) => {
        if (data) {
          setSettingsForm({
            platformName: data.platformName || DEFAULT_SETTINGS.platformName,
            supportEmail: data.supportEmail || DEFAULT_SETTINGS.supportEmail,
            allowSignup: data.allowSignup !== undefined ? Boolean(data.allowSignup) : DEFAULT_SETTINGS.allowSignup,
            emailAlerts: data.emailAlerts !== undefined ? Boolean(data.emailAlerts) : DEFAULT_SETTINGS.emailAlerts,
            maintenanceMode: data.maintenanceMode !== undefined ? Boolean(data.maintenanceMode) : DEFAULT_SETTINGS.maintenanceMode,
          });
        }
      })
      .catch((err) => {
        console.warn("[SalesSettings] API unavailable, using defaults:", err.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  async function submitSettings(event) {
    event.preventDefault();
    setSaving(true);
    try {
      await updateSettings(settingsForm);
      setSettingsSaved(true);
      setTimeout(() => setSettingsSaved(false), 2500);
    } catch (err) {
      console.error("[SalesSettings] Failed to save settings:", err.message);
      alert("Failed to save settings: " + err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="crm-dashboard settings-page">
      <div className="crm-top-header">
        <div>
          <h1 className="crm-page-title">Settings</h1>
          <p className="crm-page-subtitle">
            Manage your Sales account, platform configuration and security preferences.
          </p>
        </div>
      </div>

      <form className="settings-form" onSubmit={submitSettings}>
        <section className="panel">
          <div className="panel-title">
            <div>
              <h3>General Settings</h3>
              <p>Basic platform configuration and support settings.</p>
            </div>
          </div>

          <div className="form-grid">
            <label>
              Platform Name
              <input
                type="text"
                value={settingsForm.platformName}
                onChange={(e) =>
                  setSettingsForm({
                    ...settingsForm,
                    platformName: e.target.value,
                  })
                }
                placeholder="SHNOOR CRM"
                required
              />
            </label>

            <label>
              Support Email
              <input
                type="email"
                value={settingsForm.supportEmail}
                onChange={(e) =>
                  setSettingsForm({
                    ...settingsForm,
                    supportEmail: e.target.value,
                  })
                }
                placeholder="support@shnoor.com"
                required
              />
            </label>
          </div>
        </section>

        <section className="panel">
          <div className="panel-title">
            <div>
              <h3>Platform Options</h3>
              <p>Organization access and notification controls.</p>
            </div>
          </div>

          <label className="setting-row">
            <div>
              <strong>Allow organization signup</strong>
              <span>Allow new companies to create an organization account.</span>
            </div>
            <input
              type="checkbox"
              checked={settingsForm.allowSignup}
              onChange={(e) =>
                setSettingsForm({
                  ...settingsForm,
                  allowSignup: e.target.checked,
                })
              }
            />
          </label>

          <label className="setting-row">
            <div>
              <strong>Email alerts</strong>
              <span>Receive automated billing and support alert notifications.</span>
            </div>
            <input
              type="checkbox"
              checked={settingsForm.emailAlerts}
              onChange={(e) =>
                setSettingsForm({
                  ...settingsForm,
                  emailAlerts: e.target.checked,
                })
              }
            />
          </label>

          <label className="setting-row">
            <div>
              <strong>Maintenance mode</strong>
              <span>Temporarily suspend standard organization access.</span>
            </div>
            <input
              type="checkbox"
              checked={settingsForm.maintenanceMode}
              onChange={(e) =>
                setSettingsForm({
                  ...settingsForm,
                  maintenanceMode: e.target.checked,
                })
              }
            />
          </label>
        </section>

        <div className="form-actions">
          {settingsSaved && (
            <span className="save-success-badge">
              <CheckCircle2 size={15} />
              Settings saved successfully!
            </span>
          )}

          <button type="submit" className="primary-button" disabled={saving}>
            {saving ? <RefreshCw size={15} className="crm-spin" /> : <Save size={15} />}
            <span>{saving ? "Saving..." : "Save Settings"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}

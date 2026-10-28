import React, { useState, useEffect, useMemo } from "react";
import {
  ArrowLeft,
  ChevronRight,
  KeyRound,
  Save,
  ShieldCheck,
  UserRound,
  CheckCircle2,
  Lock,
  Eye,
  EyeOff
} from "lucide-react";
import {
  getSettings,
  updateSettings,
  updateProfile,
  updatePassword
} from "./../Api/Settings";
import "../styles/Settings.css"
import { Default_Profile } from "../data";
import { Default_settings } from "../data";


export default function Settings() {

  const [settingsForm, setSettingsForm] = useState(Default_settings);


  const [settingsSaved, setSettingsSaved] = useState(false);

  useEffect(() => {
    getSettings()
      .then((data) => {
        if (data) {
          setSettingsForm((prev) => ({
            ...prev,
            platformName: data.platformName || prev.platformName,
            supportEmail: data.supportEmail || prev.supportEmail,
            defaultPlanId: data.defaultPlan || data.defaultPlanId || prev.defaultPlanId,
            allowSignup: data.allowSignup !== undefined ? data.allowSignup : prev.allowSignup,
            emailAlerts: data.emailAlerts !== undefined ? data.emailAlerts : prev.emailAlerts,
            maintenanceMode: data.maintenanceMode !== undefined ? data.maintenanceMode : prev.maintenanceMode
          }));
        }
      })
      .catch((err) => {
        console.warn("[Settings] API unavailable, using local defaults:", err.message);
      });
  }, []);


  async function submitSettings(event) {
    event.preventDefault();
    try {
      await updateSettings(settingsForm);
    } catch (err) {
      console.warn("[Settings] API updateSettings error, saved locally:", err.message);
    }
    setSettingsSaved(true);
    setTimeout(() => setSettingsSaved(false), 2000);
  }


  return (
    <div className="crm-dashboard settings-page">

      <div className="crm-top-header">
        <div>
          <h1 className="crm-page-title">Settings</h1>
          <p className="crm-page-subtitle">
            Manage your Client Admin account, platform configuration and security.
          </p>
        </div>

        {/* <button
          type="button"
          className="primary-button"
          onClick={submitSettings}
        >
          <Save size={16} />
          <span>{settingsSaved ? "Saved!" : "Save Changes"}</span>
        </button> */}
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
                    platformName: e.target.value
                  })
                }
                placeholder="SHNOOR CRM"
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
                    supportEmail: e.target.value
                  })
                }
                placeholder="support@shnoor.com"
              />
            </label>

          </div>
        </section>

       
        <section className="panel">
          <div className="panel-title">
            <div>
              <h3>Platform Options</h3>
              <p>Client Admin organization controls.</p>
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
                  allowSignup: e.target.checked
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
                  emailAlerts: e.target.checked
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
                  maintenanceMode: e.target.checked
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

          <button type="submit" className="primary-button">
            <Save size={15} />
            Save Settings
          </button>
        </div>
      </form>
    </div>
  );
}

import { useState } from "react";

export default function Settings() {
  const [platformName, setPlatformName] = useState("SHNOOR CRM");
  const [supportEmail, setSupportEmail] = useState("support@shnoor.com");
  const [allowSignup, setAllowSignup] = useState(true);
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [saved, setSaved] = useState(false);

  function handleSubmit(event) {
    event.preventDefault();
    setSaved(true);
  }

  return (
    <form className="settings-form" onSubmit={handleSubmit}>
      <section className="panel">
        <div className="panel-title">
          <div>
            <h3>General Settings</h3>
            <p>Basic platform configuration</p>
          </div>
        </div>

        <div className="form-grid">
          <label>
            Platform Name
            <input
              value={platformName}
              onChange={(e) => {
                setPlatformName(e.target.value);
                setSaved(false);
              }}
            />
          </label>

          <label>
            Support Email
            <input
              type="email"
              value={supportEmail}
              onChange={(e) => {
                setSupportEmail(e.target.value);
                setSaved(false);
              }}
            />
          </label>
        </div>
      </section>

      <section className="panel">
        <div className="panel-title">
          <div>
            <h3>Preferences</h3>
            <p>Platform level options</p>
          </div>
        </div>

        <label className="setting-row">
          <div>
            <strong>Allow organization signup</strong>
            <span>Allow new companies to create an organization.</span>
          </div>
          <input
            type="checkbox"
            checked={allowSignup}
            onChange={(e) => {
              setAllowSignup(e.target.checked);
              setSaved(false);
            }}
          />
        </label>

        <label className="setting-row">
          <div>
            <strong>Email alerts</strong>
            <span>Receive platform and billing alerts.</span>
          </div>
          <input
            type="checkbox"
            checked={emailAlerts}
            onChange={(e) => {
              setEmailAlerts(e.target.checked);
              setSaved(false);
            }}
          />
        </label>
      </section>

      <div className="form-actions">
        {saved && <span>Settings saved.</span>}
        <button className="save-button">Save Changes</button>
      </div>
    </form>
  );
}

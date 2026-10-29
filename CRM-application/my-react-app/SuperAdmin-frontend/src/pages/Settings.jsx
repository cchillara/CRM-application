import {
  ArrowLeft,
  ChevronRight,
  KeyRound,
  Save,
  ShieldCheck,
  UserRound
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import Modal from "../components/Modal";
import { usePlatform } from "../context/PlatformContext";

function normalizeE164Phone(value) {
  return String(value || "").trim().replace(/[\s()-]/g, "");
}

function isValidE164Phone(value) {
  return /^\+[1-9]\d{7,14}$/.test(normalizeE164Phone(value));
}

export default function Settings({ accountMode = false }) {
  const { data, updateSettings, updateProfile, changePassword } = usePlatform();

  const [view, setView] = useState(accountMode ? "account" : "settings");

  const [settingsForm, setSettingsForm] = useState(data.settings);
  const [profileForm, setProfileForm] = useState(data.profile);

  const [settingsSaved, setSettingsSaved] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  const [passwordMessage, setPasswordMessage] = useState({
    type: "",
    text: ""
  });

  useEffect(() => setSettingsForm(data.settings), [data.settings]);
  useEffect(() => setProfileForm(data.profile), [data.profile]);

  const profileComplete = useMemo(() => {
    return [
      data.profile.name,
      data.profile.email,
      isValidE164Phone(data.profile.phone),
      data.profile.designation
    ].every((value) => String(value || "").trim());
  }, [data.profile]);

  const initials = (data.profile.name || "SA")
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const accountHome = (
    <div className="settings-page">
      <section className="panel account-summary-panel">
        <div className="settings-profile-summary">
          <div className="profile-large-avatar">{initials}</div>
          <div className="settings-profile-copy">
            <div className="profile-title-line">
              <h2>{data.profile.name || "Super Admin"}</h2>
              <span className={`profile-completion ${profileComplete ? "complete" : "incomplete"}`}>
                {profileComplete ? "Profile Complete" : "Profile Incomplete"}
              </span>
            </div>
            <p>{data.profile.designation}</p>
          </div>
        </div>
      </section>
      <section className="panel">
        <div className="panel-title">
          <div><h3>Account</h3><p>Manage your profile and account security.</p></div>
        </div>
        <div className="settings-option-list">
          <button type="button" className="settings-option" onClick={() => setView("profile")}>
            <div className="settings-option-icon"><UserRound size={18} /></div>
            <div className="settings-option-copy"><strong>Profile</strong><span>View and edit Super Admin profile details.</span></div>
            <div className="settings-option-right"><ChevronRight size={18} /></div>
          </button>
          <button type="button" className="settings-option" onClick={() => setView("password")}>
            <div className="settings-option-icon"><KeyRound size={18} /></div>
            <div className="settings-option-copy"><strong>Change Password</strong><span>Update your account password securely.</span></div>
            <div className="settings-option-right"><ChevronRight size={18} /></div>
          </button>
        </div>
      </section>
    </div>
  );

  async function submitSettings(event) {
    event.preventDefault();
    if (settingsSaving) return;
    setSaveError("");
    setSettingsSaving(true);
    try {
      await updateSettings(settingsForm);
      setSettingsSaved(true);
      setTimeout(() => setSettingsSaved(false), 1800);
    } catch (error) { setSaveError(error.message || "Could not save settings"); }
    finally { setSettingsSaving(false); }
  }

  async function submitProfile(event) {
    event.preventDefault();
    if (profileSaving) return;

    const cleaned = {
      ...profileForm,
      name: profileForm.name.trim(),
      email: profileForm.email.trim(),
      phone: normalizeE164Phone(profileForm.phone),
      designation: profileForm.designation.trim()
    };

    if (!cleaned.name || !cleaned.email || !cleaned.phone || !cleaned.designation) {
      setSaveError("Enter all required profile fields.");
      return;
    }
    if (!isValidE164Phone(cleaned.phone)) {
      setSaveError("Enter the phone number in international format, such as +919876543210.");
      return;
    }

    setSaveError("");
    setProfileSaving(true);
    try {
      await updateProfile(cleaned);
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 1800);
    } catch (error) { setSaveError(error.message || "Could not update profile"); }
    finally { setProfileSaving(false); }
  }

  async function submitPassword(event) {
    event.preventDefault();
    if (passwordSaving) return;
    setPasswordMessage({ type: "", text: "" });

    if (!passwordForm.currentPassword.trim()) {
      setPasswordMessage({
        type: "error",
        text: "Enter your current password."
      });
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      setPasswordMessage({
        type: "error",
        text: "New password must be at least 8 characters."
      });
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordMessage({
        type: "error",
        text: "New password and confirm password do not match."
      });
      return;
    }

    if (passwordForm.currentPassword === passwordForm.newPassword) {
      setPasswordMessage({
        type: "error",
        text: "New password must be different from the current password."
      });
      return;
    }

    setPasswordSaving(true);
    try {
      await changePassword(passwordForm.currentPassword, passwordForm.newPassword);
    } catch (error) {
      setPasswordMessage({ type: "error", text: error.message || "Password could not be changed." });
      setPasswordSaving(false);
      return;
    }

    setPasswordForm({
      currentPassword: "",
      newPassword: "",
      confirmPassword: ""
    });

    setPasswordMessage({
      type: "success",
      text: "Password changed successfully. You will be returned to login."
    });
    window.setTimeout(() => {
      ["superAdminToken", "superAdminUser", "shnoorSuperAdminToken", "shnoorSuperAdminUser"].forEach((key) => localStorage.removeItem(key));
      window.location.replace(import.meta.env.VITE_LOGIN_URL || "http://localhost:5173/login");
    }, 1400);
  }

  if (accountMode && view === "profile") {
    return <>
      {accountHome}
      <Modal open title="Edit Profile" size="large" onClose={() => { setView("account"); setProfileSaved(false); setSaveError(""); }}>
        {saveError && <div className="inline-error" role="alert">{saveError}</div>}
        <form className="form-stack account-modal-form" onSubmit={submitProfile}>
          <p className="account-modal-intro">Update the profile details used for your Super Admin account.</p>
          <div className="form-grid">
            <label>Name<input required value={profileForm.name} onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })} /></label>
            <label>Email<input required type="email" value={profileForm.email} onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })} /></label>
            <label>Phone<input required type="tel" placeholder="+919876543210" value={profileForm.phone} onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })} /></label>
            <label>Designation<input required value={profileForm.designation} onChange={(e) => setProfileForm({ ...profileForm, designation: e.target.value })} /></label>
            <label>Role<input value={profileForm.role} disabled /></label>
          </div>
          <div className="modal-actions">
            {profileSaved && <span className="modal-success-message">Profile saved.</span>}
            <button type="button" className="secondary-button" onClick={() => { setView("account"); setProfileSaved(false); setSaveError(""); }}>Cancel</button>
            <button type="submit" className="primary-button" disabled={profileSaving}><Save size={15} />{profileSaving ? "Saving…" : "Save Profile"}</button>
          </div>
        </form>
      </Modal>
    </>;
  }

  if (accountMode && view === "password") {
    return <>
      {accountHome}
      <Modal open title="Change Password" onClose={() => { setView("account"); setPasswordMessage({ type: "", text: "" }); }}>
        <form className="form-stack account-modal-form" onSubmit={submitPassword}>
          <p className="account-modal-intro">Choose a new password with at least 8 characters.</p>
          <label>Current Password<input required type="password" autoComplete="current-password" value={passwordForm.currentPassword} onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })} /></label>
          <label>New Password<input required type="password" autoComplete="new-password" value={passwordForm.newPassword} onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })} /></label>
          <label>Confirm New Password<input required type="password" autoComplete="new-password" value={passwordForm.confirmPassword} onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })} /></label>
          <div className="password-info-row">
            <div><strong>Last changed</strong><span>{data.security?.passwordLastChangedAt || "Not changed yet"}</span></div>
          </div>
          {passwordMessage.text && <div role="status" className={`password-message ${passwordMessage.type}`}>{passwordMessage.text}</div>}
          <div className="modal-actions">
            <button type="button" className="secondary-button" onClick={() => { setView("account"); setPasswordMessage({ type: "", text: "" }); }}>Cancel</button>
            <button type="submit" className="primary-button" disabled={passwordSaving}><KeyRound size={15} />{passwordSaving ? "Saving…" : "Change Password"}</button>
          </div>
        </form>
      </Modal>
    </>;
  }

  if (view === "profile") {
    return (
      <div className="settings-page">
        {saveError && <div className="inline-error" role="alert">{saveError}</div>}
        <div className="settings-subpage-heading">
          <button
            className="back-button"
            onClick={() => {
              setView(accountMode ? "account" : "settings");
              setProfileSaved(false);
            }}
          >
            <ArrowLeft size={16} />
            {accountMode ? "Back to Account" : "Back to Settings"}
          </button>

          <div>
            <h2>Profile</h2>
            <p>View and edit the Super Admin profile.</p>
          </div>
        </div>

        <section className="panel account-summary-panel">
          <div className="settings-profile-summary">
            <div className="profile-large-avatar">{initials}</div>

            <div className="settings-profile-copy">
              <div className="profile-title-line">
                <h2>{data.profile.name}</h2>
                <span
                  className={`profile-completion ${
                    profileComplete ? "complete" : "incomplete"
                  }`}
                >
                  {profileComplete ? "Profile Complete" : "Profile Incomplete"}
                </span>
              </div>

              <p>{data.profile.designation}</p>

              <div className="profile-summary-meta">
                <span>{data.profile.email}</span>
                <span>{data.profile.phone}</span>
                <span>{data.profile.role}</span>
              </div>
            </div>
          </div>
        </section>

        <form className="settings-form" onSubmit={submitProfile}>
          <section className="panel">
            <div className="panel-title settings-section-title">
              <div>
                <h3>
                  <UserRound size={17} />
                  Edit Profile
                </h3>
                <p>Update Super Admin account details.</p>
              </div>
            </div>

            <div className="form-grid">
              <label>
                Name
                <input
                  required
                  value={profileForm.name}
                  onChange={(e) =>
                    setProfileForm({
                      ...profileForm,
                      name: e.target.value
                    })
                  }
                />
              </label>

              <label>
                Email
                <input
                  required
                  type="email"
                  value={profileForm.email}
                  onChange={(e) =>
                    setProfileForm({
                      ...profileForm,
                      email: e.target.value
                    })
                  }
                />
              </label>

              <label>
                Phone
                <input
                  required
                  type="tel"
                  placeholder="+919876543210"
                  value={profileForm.phone}
                  onChange={(e) =>
                    setProfileForm({
                      ...profileForm,
                      phone: e.target.value
                    })
                  }
                />
              </label>

              <label>
                Designation
                <input
                  required
                  value={profileForm.designation}
                  onChange={(e) =>
                    setProfileForm({
                      ...profileForm,
                      designation: e.target.value
                    })
                  }
                />
              </label>

              <label>
                Role
                <input value={profileForm.role} disabled />
              </label>
            </div>

            <div className="form-actions settings-inline-actions">
              {profileSaved && <span>Profile saved.</span>}

              <button className="primary-button" disabled={profileSaving}>
                <Save size={15} />
                {profileSaving ? "Saving…" : "Save Profile"}
              </button>
            </div>
          </section>
        </form>
      </div>
    );
  }

  if (view === "password") {
    return (
      <div className="settings-page">
        {saveError && <div className="inline-error" role="alert">{saveError}</div>}
        <div className="settings-subpage-heading">
          <button
            className="back-button"
            onClick={() => {
              setView(accountMode ? "account" : "settings");
              setPasswordMessage({ type: "", text: "" });
            }}
          >
            <ArrowLeft size={16} />
            {accountMode ? "Back to Account" : "Back to Settings"}
          </button>

          <div>
            <h2>Change Password</h2>
            <p>Update the Super Admin account password.</p>
          </div>
        </div>

        <form className="settings-form" onSubmit={submitPassword}>
          <section className="panel password-card">
            <div className="panel-title settings-section-title">
              <div>
                <h3>
                  <KeyRound size={17} />
                  Password Security
                </h3>
                <p>Enter the current password before setting a new password.</p>
              </div>
            </div>

            <div className="password-form-stack">
              <label>
                Current Password
                <input
                  required
                  type="password"
                  autoComplete="current-password"
                  value={passwordForm.currentPassword}
                  onChange={(e) =>
                    setPasswordForm({
                      ...passwordForm,
                      currentPassword: e.target.value
                    })
                  }
                />
              </label>

              <label>
                New Password
                <input
                  required
                  type="password"
                  autoComplete="new-password"
                  value={passwordForm.newPassword}
                  onChange={(e) =>
                    setPasswordForm({
                      ...passwordForm,
                      newPassword: e.target.value
                    })
                  }
                />
              </label>

              <label>
                Confirm New Password
                <input
                  required
                  type="password"
                  autoComplete="new-password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) =>
                    setPasswordForm({
                      ...passwordForm,
                      confirmPassword: e.target.value
                    })
                  }
                />
              </label>
            </div>

            <div className="password-info-row">
              <div>
                <strong>Last changed</strong>
                <span>
                  {data.security?.passwordLastChangedAt || "Not changed yet"}
                </span>
              </div>

              {passwordMessage.text && (
                <div className={`password-message ${passwordMessage.type}`}>
                  {passwordMessage.text}
                </div>
              )}
            </div>

            <div className="form-actions settings-inline-actions">
              <button className="primary-button" disabled={passwordSaving}>
                <KeyRound size={15} />
                {passwordSaving ? "Saving…" : "Change Password"}
              </button>
            </div>

            <div className="security-note">The backend verifies the current password with Firebase before updating the credential and revoking existing refresh tokens.</div>
          </section>
        </form>
      </div>
    );
  }

  if (accountMode && view === "account") {
    return accountHome;
  }

  return (
    <div className="settings-page">
      {saveError && <div className="inline-error" role="alert">{saveError}</div>}
      <form className="settings-form" onSubmit={submitSettings}>
        <section className="panel">
          <div className="panel-title">
            <div>
              <h3>General Settings</h3>
              <p>Basic platform configuration.</p>
            </div>
          </div>

          <div className="form-grid">
            <label>
              Platform Name
              <input
                value={settingsForm.platformName}
                onChange={(e) =>
                  setSettingsForm({
                    ...settingsForm,
                    platformName: e.target.value
                  })
                }
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
              />
            </label>

            <label>
              Default Plan
              <select
                value={settingsForm.defaultPlanId}
                onChange={(e) =>
                  setSettingsForm({
                    ...settingsForm,
                    defaultPlanId: e.target.value
                  })
                }
              >
                {data.plans.map((plan) => (
                  <option value={plan.id} key={plan.id}>
                    {plan.name}
                  </option>
                ))}
              </select>
            </label>

          </div>
        </section>

        <section className="panel">
          <div className="panel-title">
            <div>
              <h3>Platform Options</h3>
              <p>Super Admin controls.</p>
            </div>
          </div>

          <label className="setting-row">
            <div>
              <strong>Allow organization signup</strong>
              <span>Allow new companies to create an organization.</span>
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
              <span>Receive billing and support alerts.</span>
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
              <strong>New organization alerts</strong>
              <span>Include new organization activity in platform email alerts.</span>
            </div>

            <input
              type="checkbox"
              checked={settingsForm.newOrganizationAlerts}
              onChange={(e) => setSettingsForm({ ...settingsForm, newOrganizationAlerts: e.target.checked })}
            />
          </label>

          <label className="setting-row">
            <div>
              <strong>Failed payment alerts</strong>
              <span>Include failed payment activity in platform email alerts.</span>
            </div>

            <input
              type="checkbox"
              checked={settingsForm.failedPaymentAlerts}
              onChange={(e) => setSettingsForm({ ...settingsForm, failedPaymentAlerts: e.target.checked })}
            />
          </label>

          <label className="setting-row">
            <div>
              <strong>Weekly summary email</strong>
              <span>Include a weekly overview of platform activity in email alerts.</span>
            </div>

            <input
              type="checkbox"
              checked={settingsForm.weeklySummaryEmail}
              onChange={(e) => setSettingsForm({ ...settingsForm, weeklySummaryEmail: e.target.checked })}
            />
          </label>

          <label className="setting-row">
            <div>
              <strong>Maintenance mode</strong>
              <span>Temporarily stop organization access.</span>
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
          {settingsSaved && <span>Settings saved.</span>}

          <button className="primary-button" disabled={settingsSaving}>
            <Save size={15} />
            {settingsSaving ? "Saving…" : "Save Settings"}
          </button>
        </div>
      </form>
    </div>
  );
}

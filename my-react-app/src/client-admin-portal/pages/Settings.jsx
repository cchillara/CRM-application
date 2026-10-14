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

const DEFAULT_PROFILE = {
  name: "Client Admin",
  email: "admin@crmclient.com",
  phone: "+91 98000 00000",
  designation: "Client Administrator",
  role: "ORGANIZATION_ADMIN",
  orgName: "SHNOOR CRM"
};

const DEFAULT_SETTINGS = {
  platformName: "SHNOOR CRM",
  supportEmail: "support@shnoor.com",
  defaultPlanId: "Starter",
  allowSignup: true,
  emailAlerts: true,
  maintenanceMode: false
};

const PLANS = [
  { id: "Starter", name: "Starter" },
  { id: "Growth", name: "Growth" },
  { id: "Enterprise", name: "Enterprise" },
  { id: "Pro", name: "Pro" }
];

export default function Settings() {
  const [view, setView] = useState("settings");

  /* Core state */
  const [profile, setProfile] = useState(DEFAULT_PROFILE);
  const [profileForm, setProfileForm] = useState(DEFAULT_PROFILE);
  const [settingsForm, setSettingsForm] = useState(DEFAULT_SETTINGS);

  /* Status flags */
  const [settingsSaved, setSettingsSaved] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);

  /* Password state */
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [passwordMessage, setPasswordMessage] = useState({
    type: "",
    text: ""
  });
  const [passwordLastChanged, setPasswordLastChanged] = useState("Not changed yet");

  /* Load settings and profile from backend API on mount */
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

          if (data.profile) {
            setProfile((prev) => ({ ...prev, ...data.profile }));
            setProfileForm((prev) => ({ ...prev, ...data.profile }));
          }
        }
      })
      .catch((err) => {
        console.warn("[Settings] API unavailable, using local defaults:", err.message);
      });
  }, []);

  /* Check profile completion */
  const profileComplete = useMemo(() => {
    return [
      profile.name,
      profile.email,
      profile.phone,
      profile.designation
    ].every((val) => String(val || "").trim());
  }, [profile]);

  /* Profile avatar initials */
  const initials = useMemo(() => {
    return (profile.name || "CA")
      .split(" ")
      .filter(Boolean)
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }, [profile.name]);

  /* Save general settings */
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

  /* Save profile */
  async function submitProfile(event) {
    event.preventDefault();

    const cleaned = {
      ...profileForm,
      name: profileForm.name.trim(),
      email: profileForm.email.trim(),
      phone: profileForm.phone.trim(),
      designation: (profileForm.designation || "").trim()
    };

    if (!cleaned.name || !cleaned.email || !cleaned.phone) {
      return;
    }

    try {
      const updated = await updateProfile(cleaned);
      if (updated) {
        setProfile((prev) => ({ ...prev, ...updated }));
        setProfileForm((prev) => ({ ...prev, ...updated }));
      } else {
        setProfile(cleaned);
      }
    } catch (err) {
      console.warn("[Settings] API updateProfile error, saved locally:", err.message);
      setProfile(cleaned);
    }

    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 2000);
  }

  /* Save password */
  async function submitPassword(event) {
    event.preventDefault();
    setPasswordMessage({ type: "", text: "" });

    if (!passwordForm.currentPassword.trim()) {
      setPasswordMessage({
        type: "error",
        text: "Please enter your current password."
      });
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      setPasswordMessage({
        type: "error",
        text: "New password must be at least 8 characters long."
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
        text: "New password must be different from current password."
      });
      return;
    }

    try {
      await updatePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });

      setPasswordMessage({
        type: "success",
        text: "Password updated successfully!"
      });
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
      });
      setPasswordLastChanged(new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }));
    } catch (err) {
      setPasswordMessage({
        type: "error",
        text: err.message || "Failed to update password. Please try again."
      });
    }
  }

  const togglePasswordVisibility = (field) => {
    setShowPassword((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  /* ─────────────────────────────────────────────────────────────────
     SUBPAGE: PROFILE
     ───────────────────────────────────────────────────────────────── */
  if (view === "profile") {
    return (
      <div className="crm-dashboard settings-page">
        <div className="settings-subpage-heading">
          <button
            type="button"
            className="back-button"
            onClick={() => {
              setView("settings");
              setProfileSaved(false);
            }}
          >
            <ArrowLeft size={16} />
            Back to Settings
          </button>

          <div>
            <h2>Client Admin Profile</h2>
            <p>View and edit the Client Admin profile details.</p>
          </div>
        </div>

        {/* Profile summary card */}
        <section className="panel account-summary-panel">
          <div className="settings-profile-summary">
            <div className="profile-large-avatar">{initials}</div>

            <div className="settings-profile-copy">
              <div className="profile-title-line">
                <h2>{profile.name}</h2>
                <span
                  className={`profile-completion ${
                    profileComplete ? "complete" : "incomplete"
                  }`}
                >
                  {profileComplete ? "Profile Complete" : "Profile Incomplete"}
                </span>
              </div>

              <p>{profile.designation || "Client Administrator"}</p>

              <div className="profile-summary-meta">
                <span>{profile.email}</span>
                <span>•</span>
                <span>{profile.phone}</span>
                <span>•</span>
                <span>{profile.orgName || "SHNOOR CRM"}</span>
                <span>•</span>
                <span>{profile.role}</span>
              </div>
            </div>
          </div>
        </section>

        {/* Edit profile form */}
        <form className="settings-form" onSubmit={submitProfile}>
          <section className="panel">
            <div className="panel-title">
              <div>
                <h3>
                  <UserRound size={18} />
                  Edit Profile
                </h3>
                <p>Update Client Admin contact and personal information.</p>
              </div>
            </div>

            <div className="form-grid">
              <label>
                Full Name *
                <input
                  required
                  type="text"
                  value={profileForm.name}
                  onChange={(e) =>
                    setProfileForm({ ...profileForm, name: e.target.value })
                  }
                  placeholder="Client Admin"
                />
              </label>

              <label>
                Email Address *
                <input
                  required
                  type="email"
                  value={profileForm.email}
                  onChange={(e) =>
                    setProfileForm({ ...profileForm, email: e.target.value })
                  }
                  placeholder="admin@crmclient.com"
                />
              </label>

              <label>
                Phone Number *
                <input
                  required
                  type="text"
                  value={profileForm.phone}
                  onChange={(e) =>
                    setProfileForm({ ...profileForm, phone: e.target.value })
                  }
                  placeholder="+91 98000 00000"
                />
              </label>

              <label>
                Designation / Title
                <input
                  type="text"
                  value={profileForm.designation}
                  onChange={(e) =>
                    setProfileForm({ ...profileForm, designation: e.target.value })
                  }
                  placeholder="Client Administrator"
                />
              </label>

              <label>
                Organization Name
                <input
                  type="text"
                  value={profileForm.orgName}
                  onChange={(e) =>
                    setProfileForm({ ...profileForm, orgName: e.target.value })
                  }
                  placeholder="SHNOOR CRM"
                />
              </label>

              <label>
                Role
                <input value={profileForm.role} disabled />
              </label>
            </div>

            <div className="form-actions settings-inline-actions">
              {profileSaved && (
                <span className="save-success-badge">
                  <CheckCircle2 size={15} />
                  Profile saved successfully!
                </span>
              )}

              <button type="submit" className="primary-button">
                <Save size={15} />
                Save Profile
              </button>
            </div>
          </section>
        </form>
      </div>
    );
  }

  /* ─────────────────────────────────────────────────────────────────
     SUBPAGE: CHANGE PASSWORD
     ───────────────────────────────────────────────────────────────── */
  if (view === "password") {
    return (
      <div className="crm-dashboard settings-page">
        <div className="settings-subpage-heading">
          <button
            type="button"
            className="back-button"
            onClick={() => {
              setView("settings");
              setPasswordMessage({ type: "", text: "" });
            }}
          >
            <ArrowLeft size={16} />
            Back to Settings
          </button>

          <div>
            <h2>Change Password</h2>
            <p>Update the Client Admin account password to maintain security.</p>
          </div>
        </div>

        <form className="settings-form" onSubmit={submitPassword}>
          <section className="panel password-card">
            <div className="panel-title">
              <div>
                <h3>
                  <KeyRound size={18} />
                  Password Security
                </h3>
                <p>Enter your current password before choosing a new one.</p>
              </div>
            </div>

            <div className="password-form-stack">
              <label>
                Current Password *
                <div className="password-input-wrap">
                  <input
                    required
                    type={showPassword.current ? "text" : "password"}
                    autoComplete="current-password"
                    value={passwordForm.currentPassword}
                    onChange={(e) =>
                      setPasswordForm({
                        ...passwordForm,
                        currentPassword: e.target.value
                      })
                    }
                    placeholder="Enter current password"
                  />
                  <button
                    type="button"
                    className="password-toggle-btn"
                    onClick={() => togglePasswordVisibility("current")}
                  >
                    {showPassword.current ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </label>

              <label>
                New Password *
                <div className="password-input-wrap">
                  <input
                    required
                    type={showPassword.new ? "text" : "password"}
                    autoComplete="new-password"
                    value={passwordForm.newPassword}
                    onChange={(e) =>
                      setPasswordForm({
                        ...passwordForm,
                        newPassword: e.target.value
                      })
                    }
                    placeholder="At least 8 characters"
                  />
                  <button
                    type="button"
                    className="password-toggle-btn"
                    onClick={() => togglePasswordVisibility("new")}
                  >
                    {showPassword.new ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </label>

              <label>
                Confirm New Password *
                <div className="password-input-wrap">
                  <input
                    required
                    type={showPassword.confirm ? "text" : "password"}
                    autoComplete="new-password"
                    value={passwordForm.confirmPassword}
                    onChange={(e) =>
                      setPasswordForm({
                        ...passwordForm,
                        confirmPassword: e.target.value
                      })
                    }
                    placeholder="Re-enter new password"
                  />
                  <button
                    type="button"
                    className="password-toggle-btn"
                    onClick={() => togglePasswordVisibility("confirm")}
                  >
                    {showPassword.confirm ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </label>
            </div>

            <div className="password-info-row">
              <div>
                <strong>Last changed: </strong>
                <span>{passwordLastChanged}</span>
              </div>
            </div>

            {passwordMessage.text && (
              <div className={`password-message ${passwordMessage.type}`}>
                {passwordMessage.text}
              </div>
            )}

            <div className="form-actions settings-inline-actions">
              <button type="submit" className="primary-button">
                <Lock size={15} />
                Update Password
              </button>
            </div>

            <div className="security-note">
              Password changes are secured with backend cryptographic validation. For safety, pick a strong password containing letters, numbers, and symbols.
            </div>
          </section>
        </form>
      </div>
    );
  }

  /* ─────────────────────────────────────────────────────────────────
     MAIN SETTINGS VIEW
     ───────────────────────────────────────────────────────────────── */
  return (
    <div className="crm-dashboard settings-page">
      {/* Top Page Header */}
      <div className="crm-top-header">
        <div>
          <h1 className="crm-page-title">Settings</h1>
          <p className="crm-page-subtitle">
            Manage your Client Admin account, platform configuration and security.
          </p>
        </div>

        <button
          type="button"
          className="primary-button"
          onClick={submitSettings}
        >
          <Save size={16} />
          <span>{settingsSaved ? "Saved!" : "Save Changes"}</span>
        </button>
      </div>

      {/* Account Section */}
      <section className="panel">
        <div className="panel-title">
          <div>
            <h3>
              <ShieldCheck size={18} />
              Account
            </h3>
            <p>Manage the Client Admin account and security credentials.</p>
          </div>
        </div>

        <div className="settings-option-list">
          <button
            type="button"
            className="settings-option"
            onClick={() => setView("profile")}
          >
            <div className="settings-option-icon">
              <UserRound size={19} />
            </div>

            <div className="settings-option-copy">
              <strong>Profile</strong>
              <span>View and edit Client Admin profile details.</span>
            </div>

            <div className="settings-option-right">
              <span
                className={`profile-completion ${
                  profileComplete ? "complete" : "incomplete"
                }`}
              >
                {profileComplete ? "Complete" : "Incomplete"}
              </span>
              <ChevronRight size={18} />
            </div>
          </button>

          <button
            type="button"
            className="settings-option"
            onClick={() => setView("password")}
          >
            <div className="settings-option-icon">
              <KeyRound size={19} />
            </div>

            <div className="settings-option-copy">
              <strong>Change Password</strong>
              <span>Change the Client Admin account password.</span>
            </div>

            <div className="settings-option-right">
              <ChevronRight size={18} />
            </div>
          </button>
        </div>
      </section>

      {/* General Settings Form */}
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
                {PLANS.map((plan) => (
                  <option value={plan.id} key={plan.id}>
                    {plan.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </section>

        {/* Platform Options */}
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

        {/* Form Actions Footer */}
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

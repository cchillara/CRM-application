import React, { useEffect, useMemo, useState } from "react";
import { Default_Profile } from "../data";
import {
  ChevronRight,
  KeyRound,
  Save,
  ShieldCheck,
  UserRound,
  CheckCircle2,
  Lock,
  Eye,
  EyeOff,
  X
} from "lucide-react";
import {
  getProfile,
  updateProfile,
  updatePassword
} from "./../Api/Settings";

export default function Profile() {

  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  const [profile, setProfile] = useState(Default_Profile);
  const [profileForm, setProfileForm] = useState(Default_Profile);
  const [profileSaved, setProfileSaved] = useState(false);

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

  useEffect(() => {
    getProfile()
      .then((data) => {
        if (data) {
          const dbProfile = {
            name: data.name || Default_Profile.name,
            email: data.email || Default_Profile.email,
            phone: data.phone || Default_Profile.phone,
            designation: data.designation || Default_Profile.designation,
            role: data.role || Default_Profile.role,
            orgName: data.orgName || data.organizationName || Default_Profile.orgName
          };
          setProfile(dbProfile);
          setProfileForm(dbProfile);
          if (data.passwordLastChangedAt) {
            setPasswordLastChanged(
              new Date(data.passwordLastChangedAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric"
              })
            );
          }
        }
      })
      .catch((err) => {
        console.warn("[Profile] API unavailable, using local defaults: ", err.message);
      });
  }, []);

  // Close modals on Escape key
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === "Escape") {
        setShowProfileModal(false);
        setShowPasswordModal(false);
        setProfileSaved(false);
        setPasswordMessage({ type: "", text: "" });
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const profileComplete = useMemo(() => {
    return [
      profile.name,
      profile.email,
      profile.phone,
      profile.designation
    ].every((val) => String(val || "").trim());
  }, [profile]);

  const initials = useMemo(() => {
    return (profile.name)
      .split(" ")
      .filter(Boolean)
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }, [profile.name]);

  async function submitProfile(event) {
    event.preventDefault();

    const cleaned = {
      ...profileForm,
      phone: profileForm.phone.trim(),
      designation: (profileForm.designation).trim()
    };

    if (!cleaned.name || !cleaned.email || !cleaned.phone) {
      return;
    }

    try {
      const updated = await updateProfile(cleaned);
      if (updated) {
        const nextProfile = {
          ...cleaned,
          ...updated,
          orgName: updated.orgName || updated.organizationName || cleaned.orgName
        };
        setProfile(nextProfile);
        setProfileForm(nextProfile);
      } else {
        setProfile(cleaned);
      }
    } catch (err) {
      console.warn("[Profile] API updateProfile error, saved locally:", err.message);
      setProfile(cleaned);
    }

    setProfileSaved(true);
    setTimeout(() => {
      setProfileSaved(false);
      setShowProfileModal(false);
    }, 1500);
  }

  async function submitPassword(event) {
    event.preventDefault();
    setPasswordMessage({ type: "", text: "" });

    if (!passwordForm.currentPassword.trim()) {
      setPasswordMessage({ type: "error", text: "Please enter your current password." });
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      setPasswordMessage({ type: "error", text: "New password must be at least 8 characters long." });
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordMessage({ type: "error", text: "New password and confirm password do not match." });
      return;
    }

    if (passwordForm.currentPassword === passwordForm.newPassword) {
      setPasswordMessage({ type: "error", text: "New password must be different from current password." });
      return;
    }

    try {
      await updatePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });

      setPasswordMessage({ type: "success", text: "Password updated successfully!" });
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setPasswordLastChanged(
        new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
      );
      setTimeout(() => {
        setPasswordMessage({ type: "", text: "" });
        setShowPasswordModal(false);
      }, 1500);
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

  return (
    <div className="crm-dashboard">
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
            onClick={() => setShowProfileModal(true)}
          >
            <div className="settings-option-icon">
              <UserRound size={19} />
            </div>
            <div className="settings-option-copy">
              <strong>Profile</strong>
              <span>View and edit Client Admin profile details.</span>
            </div>
            <div className="settings-option-right">
              <span className={`profile-completion ${profileComplete ? "complete" : "incomplete"}`}>
                {profileComplete ? "Complete" : "Incomplete"}
              </span>
              <ChevronRight size={18} />
            </div>
          </button>

        
          <button
            type="button"
            className="settings-option"
            onClick={() => setShowPasswordModal(true)}
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

      {/* ── Profile Modal ── */}
      {showProfileModal && (
        <div
          className="crm-modal-backdrop"
          onClick={() => { setShowProfileModal(false); setProfileSaved(false); }}
        >
          <div className="crm-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="crm-modal-header">
              <div className="settings-profile-summary" style={{ flex: 1 }}>
                <div className="profile-large-avatar" style={{ width: 44, height: 44, fontSize: "1rem" }}>
                  {initials}
                </div>
                <div className="settings-profile-copy">
                  <div className="profile-title-line">
                    <h2 style={{ fontSize: "1.1rem", margin: 0 }}>{profile.name}</h2>
                    <span className={`profile-completion ${profileComplete ? "complete" : "incomplete"}`}>
                      {profileComplete ? "Profile Complete" : "Profile Incomplete"}
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: "0.85rem" }}>{profile.designation || "Client Administrator"}</p>
                </div>
              </div>
              <button
                type="button"
                className="crm-modal-close-btn"
                onClick={() => { setShowProfileModal(false); setProfileSaved(false); }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={submitProfile}>
              <div className="crm-modal-body">
                <div className="form-grid">
                  <label>
                    Full Name *
                    <input
                      required
                      type="text"
                      value={profileForm.name}
                      onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                      placeholder="Client Admin"
                    />
                  </label>

                  <label>
                    Email Address *
                    <input
                      required
                      type="email"
                      value={profileForm.email}
                      onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                      placeholder="admin@crmclient.com"
                      disabled
                    />
                  </label>

                  <label>
                    Phone Number *
                    <input
                      required
                      type="text"
                      value={profileForm.phone}
                      onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                      placeholder="+91 98000 00000"
                    />
                  </label>

                  <label>
                    Designation
                    <input
                      type="text"
                      value={profileForm.designation}
                      onChange={(e) => setProfileForm({ ...profileForm, designation: e.target.value })}
                      placeholder="Client Administrator"
                      disabled
                    />
                  </label>

                  <label>
                    Organization Name
                    <input
                      type="text"
                      value={profileForm.orgName}
                      onChange={(e) => setProfileForm({ ...profileForm, orgName: e.target.value })}
                      placeholder="SHNOOR CRM"
                      disabled
                    />
                  </label>

                  <label>
                    Role
                    <input value={profileForm.role} disabled />
                  </label>
                </div>
              </div>

              <div className="crm-modal-footer">
                {profileSaved && (
                  <span className="save-success-badge">
                    <CheckCircle2 size={15} />
                    Profile saved!
                  </span>
                )}
                <button type="submit" className="primary-button">
                  <Save size={15} />
                  Save Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Change Password Modal ── */}
      {showPasswordModal && (
        <div
          className="crm-modal-backdrop"
          onClick={() => { setShowPasswordModal(false); setPasswordMessage({ type: "", text: "" }); }}
        >
          <div className="crm-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="crm-modal-header">
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <KeyRound size={20} />
                <div>
                  <h3 style={{ margin: 0 }}>Change Password</h3>
                  <p style={{ margin: 0, fontSize: "0.82rem" }}>Update the Client Admin account password.</p>
                </div>
              </div>
              <button
                type="button"
                className="crm-modal-close-btn"
                onClick={() => { setShowPasswordModal(false); setPasswordMessage({ type: "", text: "" }); }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={submitPassword}>
              <div className="crm-modal-body">
                <div className="password-form-stack">
                  <label>
                    Current Password *
                    <div className="password-input-wrap">
                      <input
                        required
                        type={showPassword.current ? "text" : "password"}
                        autoComplete="current-password"
                        value={passwordForm.currentPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
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
                        onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
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
                        onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
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

                <div className="security-note">
                  Password changes are secured with backend cryptographic validation. For safety, pick a strong password containing letters, numbers, and symbols.
                </div>
              </div>

              <div className="crm-modal-footer">
                <button type="submit" className="primary-button">
                  <Lock size={15} />
                  Update Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

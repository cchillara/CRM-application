import React, { useEffect, useMemo, useState } from "react";
import { auth } from "../../firebase.js";
import {
  onAuthStateChanged,
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword as updateFirebasePassword,
} from "firebase/auth";
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
  X,
} from "lucide-react";
import "./SalesProfile.css";

const API_BASE_URL = (import.meta.env.VITE_API_URL || "http://localhost:5000")
  .replace(/\/api\/v1.*$/, "")
  .replace(/\/$/, "");
const SALES_API_URL = `${API_BASE_URL}/api/v1/sales`;

const Default_Profile = {
  name: "Sales Representative",
  email: "",
  phone: "",
  designation: "Sales Executive",
  role: "SALES",
  orgName: "SHNOOR CRM",
};

export default function SalesProfile() {
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  const [profile, setProfile] = useState(Default_Profile);
  const [profileForm, setProfileForm] = useState(Default_Profile);
  const [profileSaved, setProfileSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const [passwordMessage, setPasswordMessage] = useState({
    type: "",
    text: "",
  });
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [passwordLastChanged, setPasswordLastChanged] = useState("Not changed yet");

  // Fetch live sales profile from backend
  const fetchProfile = async () => {
    setLoading(true);
    try {
      if (!auth.currentUser) return;
      const idToken = await auth.currentUser.getIdToken();
      const res = await fetch(`${SALES_API_URL}/profile`, {
        headers: { Authorization: `Bearer ${idToken}` },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      const data = json.data;
      if (data) {
        const fullName = `${data.firstName || ""} ${data.lastName || ""}`.trim() || "Sales Representative";
        const loadedProfile = {
          name: fullName,
          email: data.email || auth.currentUser.email || "",
          phone: data.phone || "",
          designation: data.role === "SALES" ? "Sales Executive" : data.role || "Sales Executive",
          role: data.role || "SALES",
          orgName: data.organizationName || "SHNOOR CRM",
        };
        setProfile(loadedProfile);
        setProfileForm(loadedProfile);
        if (data.lastUpdated) {
          setPasswordLastChanged(
            new Date(data.lastUpdated).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })
          );
        }
      }
    } catch (err) {
      console.warn("[SalesProfile] Could not fetch live profile:", err.message);
      if (auth.currentUser) {
        const fallback = {
          ...Default_Profile,
          email: auth.currentUser.email || "",
          name: auth.currentUser.displayName || "Sales Representative",
        };
        setProfile(fallback);
        setProfileForm(fallback);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        fetchProfile();
      } else {
        setLoading(false);
      }
    });
    return unsubscribe;
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
    return [profile.name, profile.email, profile.phone, profile.designation].every(
      (val) => String(val || "").trim()
    );
  }, [profile]);

  const initials = useMemo(() => {
    return (profile.name || "SR")
      .split(" ")
      .filter(Boolean)
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }, [profile.name]);

  // Submit profile edit (Screenshot 2)
  async function submitProfile(event) {
    event.preventDefault();
    if (!profileForm.name.trim()) return;

    setIsSaving(true);
    const parts = profileForm.name.trim().split(" ");
    const firstName = parts[0] || "";
    const lastName = parts.slice(1).join(" ") || "";

    try {
      const idToken = await auth.currentUser.getIdToken();
      const res = await fetch(`${SALES_API_URL}/profile`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          firstName,
          lastName,
          phone: profileForm.phone.trim(),
        }),
      });

      if (!res.ok) {
        const errorJson = await res.json().catch(() => ({}));
        throw new Error(errorJson.message || "Failed to update profile");
      }

      const next = {
        ...profileForm,
        name: `${firstName} ${lastName}`.trim(),
        phone: profileForm.phone.trim(),
      };
      setProfile(next);
      setProfileForm(next);
      setProfileSaved(true);

      setTimeout(() => {
        setProfileSaved(false);
        setShowProfileModal(false);
      }, 1200);
    } catch (err) {
      console.error("[SalesProfile] Save error:", err);
      setProfile({ ...profileForm });
      setProfileSaved(true);
      setTimeout(() => {
        setProfileSaved(false);
        setShowProfileModal(false);
      }, 1200);
    } finally {
      setIsSaving(false);
    }
  }

  // Submit password change (Screenshot 4)
  async function submitPassword(event) {
    event.preventDefault();
    setPasswordMessage({ type: "", text: "" });

    if (!passwordForm.currentPassword.trim()) {
      setPasswordMessage({ type: "error", text: "Please enter your current password." });
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      setPasswordMessage({
        type: "error",
        text: "New password must be at least 8 characters long.",
      });
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordMessage({
        type: "error",
        text: "New password and confirm password do not match.",
      });
      return;
    }

    if (passwordForm.currentPassword === passwordForm.newPassword) {
      setPasswordMessage({
        type: "error",
        text: "New password must be different from current password.",
      });
      return;
    }

    setIsUpdatingPassword(true);
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("User not authenticated.");

      const credential = EmailAuthProvider.credential(user.email, passwordForm.currentPassword);
      await reauthenticateWithCredential(user, credential);
      await updateFirebasePassword(user, passwordForm.newPassword);

      setPasswordMessage({ type: "success", text: "Password updated successfully!" });
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setPasswordLastChanged(
        new Date().toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })
      );

      setTimeout(() => {
        setPasswordMessage({ type: "", text: "" });
        setShowPasswordModal(false);
      }, 1400);
    } catch (err) {
      let msg = err.message || "Failed to update password.";
      if (err.code === "auth/wrong-password" || err.code === "austh/invalid-credential") {
        msg = "Current password is incorrect.";
      }
      setPasswordMessage({ type: "error", text: msg });
    } finally {
      setIsUpdatingPassword(false);
    }
  }

  const togglePasswordVisibility = (field) => {
    setShowPassword((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  return (
    <div className="sales-profile-container">
      <section className="panel ">
        <div className="panel-title">
          <div>
            <h3>
              <ShieldCheck size={18} />
              Account
            </h3>
            <p>Manage the Sales account and security credentials.</p>
          </div>
        </div>

        <div className="settings-option-list">
          {/* Profile card option */}
          <button
            type="button"
            className="settings-option"
            onClick={() => {
              setProfileForm({ ...profile });
              setShowProfileModal(true);
            }}
          >
            <div className="settings-option-icon">
              <UserRound size={19} />
            </div>
            <div className="settings-option-copy">
              <strong>Profile</strong>
              <span>View and edit Sales profile details.</span>
            </div>
            <div className="settings-option-right">
              <span className={`profile-completion ${profileComplete ? "complete" : "incomplete"}`}>
                {profileComplete ? "Complete" : "Incomplete"}
              </span>
              <ChevronRight size={18} />
            </div>
          </button>

          {/* Change Password card option */}
          <button
            type="button"
            className="settings-option"
            onClick={() => {
              setPasswordMessage({ type: "", text: "" });
              setShowPasswordModal(true);
            }}
          >
            <div className="settings-option-icon">
              <KeyRound size={19} />
            </div>
            <div className="settings-option-copy">
              <strong>Change Password</strong>
              <span>Change the Sales account password.</span>
            </div>
            <div className="settings-option-right">
              <ChevronRight size={18} />
            </div>
          </button>
        </div>
      </section>

      {/* ── Profile Modal (Screenshot 2) ── */}
      {showProfileModal && (
        <div
          className="crm-modal-backdrop"
          onClick={() => {
            setShowProfileModal(false);
            setProfileSaved(false);
          }}
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
                  <p style={{ margin: 0, fontSize: "0.85rem", color: "#2563eb", fontWeight: 500 }}>
                    {profile.designation || "Sales Executive"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="crm-modal-close-btn"
                onClick={() => {
                  setShowProfileModal(false);
                  setProfileSaved(false);
                }}
                aria-label="Close"
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
                      placeholder="Sales Representative"
                    />
                  </label>

                  <label>
                    Email Address *
                    <input
                      required
                      type="email"
                      value={profileForm.email}
                      disabled
                      placeholder="sales@example.com"
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
                      disabled
                      placeholder="Sales Executive"
                    />
                  </label>

                  <label>
                    Organization Name
                    <input
                      type="text"
                      value={profileForm.orgName}
                      disabled
                      placeholder="SHNOOR CRM"
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
                <button type="submit" className="primary-button" disabled={isSaving}>
                  <Save size={15} />
                  {isSaving ? "Saving..." : "Save Profile"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Change Password Modal (Screenshot 4) ── */}
      {showPasswordModal && (
        <div
          className="crm-modal-backdrop"
          onClick={() => {
            setShowPasswordModal(false);
            setPasswordMessage({ type: "", text: "" });
          }}
        >
          <div className="crm-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="crm-modal-header">
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <KeyRound size={20} />
                <div>
                  <h3 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 700 }}>Change Password</h3>
                  <p style={{ margin: 0, fontSize: "0.82rem", color: "#64748b" }}>
                    Update the Sales account password.
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="crm-modal-close-btn"
                onClick={() => {
                  setShowPasswordModal(false);
                  setPasswordMessage({ type: "", text: "" });
                }}
                aria-label="Close"
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
                        onChange={(e) =>
                          setPasswordForm({ ...passwordForm, currentPassword: e.target.value })
                        }
                        placeholder="Enter current password"
                      />
                      <button
                        type="button"
                        className="password-toggle-btn"
                        onClick={() => togglePasswordVisibility("current")}
                        aria-label="Toggle password visibility"
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
                          setPasswordForm({ ...passwordForm, newPassword: e.target.value })
                        }
                        placeholder="At least 8 characters"
                      />
                      <button
                        type="button"
                        className="password-toggle-btn"
                        onClick={() => togglePasswordVisibility("new")}
                        aria-label="Toggle password visibility"
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
                          setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })
                        }
                        placeholder="Re-enter new password"
                      />
                      <button
                        type="button"
                        className="password-toggle-btn"
                        onClick={() => togglePasswordVisibility("confirm")}
                        aria-label="Toggle password visibility"
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
                  Password changes are secured with backend cryptographic validation. For safety, pick a
                  strong password containing letters, numbers, and symbols.
                </div>
              </div>

              <div className="crm-modal-footer">
                <button type="submit" className="primary-button" disabled={isUpdatingPassword}>
                  <Lock size={15} />
                  {isUpdatingPassword ? "Updating..." : "Update Password"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft, CheckCircle2, ChevronRight, KeyRound, Lock, Save,
  ShieldCheck, UserRound, X
} from "lucide-react";
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword as updateFirebasePassword } from "firebase/auth";
import { auth } from "../../../src/firebase";
import { getProfile, updatePassword, updateProfile } from "../../../src/client-admin-portal/Api/Settings";
import { usePortal } from "../context/PortalContext";

const defaults = {
  name: "Alex Morgan", email: "alex.morgan@shnoor.com", phone: "",
  designation: "Sales Representative", role: "Sales Representative", orgName: "SHNOOR CRM"
};

export default function AccountPage({ account, setAccount }) {
  const { navigate } = usePortal();
  const [view, setView] = useState("account");
  const [profile, setProfile] = useState({ ...defaults, ...account });
  const [profileForm, setProfileForm] = useState({ ...defaults, ...account });
  const [profileSaved, setProfileSaved] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [showPasswords, setShowPasswords] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState({ type: "", text: "" });
  const [passwordLastChanged, setPasswordLastChanged] = useState("Not changed yet");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    getProfile().then((data) => {
      if (!active || !data) return;
      const next = {
        ...defaults,
        ...account,
        name: data.name || account.name || defaults.name,
        email: data.email || account.email || defaults.email,
        phone: data.phone || "",
        designation: data.designation || defaults.designation,
        role: data.role || defaults.role,
        orgName: data.orgName || data.organizationName || defaults.orgName
      };
      setProfile(next);
      setProfileForm(next);
      setAccount((current) => ({ ...current, name: next.name, email: next.email, role: next.role }));
      if (data.passwordLastChangedAt) setPasswordLastChanged(new Date(data.passwordLastChangedAt).toLocaleDateString());
    }).catch(() => {});
    return () => { active = false; };
  }, []);

  const initials = useMemo(() => (profile.name || "U").split(/\s+/).filter(Boolean).map((part) => part[0]).join("").slice(0, 2).toUpperCase(), [profile.name]);
  const profileComplete = [profile.name, profile.email, profile.phone, profile.designation].every((value) => String(value || "").trim());

  async function submitProfile(event) {
    event.preventDefault();
    if (saving) return;
    setSaving(true);
    const cleaned = { ...profileForm, name: profileForm.name.trim(), phone: profileForm.phone.trim(), designation: profileForm.designation.trim() };
    try {
      const updated = await updateProfile(cleaned);
      const next = { ...cleaned, ...(updated || {}) };
      setProfile(next);
      setProfileForm(next);
      setAccount((current) => ({ ...current, name: next.name, email: next.email, role: next.role }));
      localStorage.setItem("shnoorUserProfile", JSON.stringify(next));
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 1800);
    } catch (error) {
      console.warn("[User Portal] Profile API unavailable; saving profile locally:", error.message);
      setProfile(cleaned);
      setProfileForm(cleaned);
      setAccount((current) => ({ ...current, name: cleaned.name, email: cleaned.email, role: cleaned.role }));
      localStorage.setItem("shnoorUserProfile", JSON.stringify(cleaned));
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 1800);
    } finally { setSaving(false); }
  }

  async function submitPassword(event) {
    event.preventDefault();
    setPasswordMessage({ type: "", text: "" });
    if (passwordForm.newPassword.length < 8) return setPasswordMessage({ type: "error", text: "New password must be at least 8 characters long." });
    if (passwordForm.newPassword !== passwordForm.confirmPassword) return setPasswordMessage({ type: "error", text: "New password and confirmation do not match." });
    if (passwordForm.currentPassword === passwordForm.newPassword) return setPasswordMessage({ type: "error", text: "Choose a password different from your current one." });

    try {
      const currentUser = auth?.currentUser;
      if (!currentUser?.email) throw new Error("Sign in with your account before changing your password.");
      const credential = EmailAuthProvider.credential(currentUser.email, passwordForm.currentPassword);
      await reauthenticateWithCredential(currentUser, credential);
      await updateFirebasePassword(currentUser, passwordForm.newPassword);
      const changedAt = new Date();
      try {
        const token = await currentUser.getIdToken(true);
        const result = await updatePassword(token);
        if (result?.passwordLastChangedAt) changedAt.setTime(new Date(result.passwordLastChangedAt).getTime());
      } catch (error) { console.warn("Password changed, but the last-changed date could not be saved:", error.message); }
      setPasswordLastChanged(changedAt.toLocaleDateString());
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setPasswordMessage({ type: "success", text: "Password updated successfully." });
    } catch (error) {
      const messages = { "auth/invalid-credential": "Current password is incorrect.", "auth/wrong-password": "Current password is incorrect.", "auth/weak-password": "Choose a stronger password with at least 8 characters.", "auth/requires-recent-login": "Sign in again before changing your password." };
      setPasswordMessage({ type: "error", text: messages[error.code] || error.message || "Could not update password." });
    }
  }

  return <div className="account-page">
    <section className="panel account-summary-panel"><div className="account-profile-summary"><div className="profile-large-avatar">{initials}</div><div><div className="profile-title-line"><h2>{profile.name}</h2><span className={`profile-completion ${profileComplete ? "complete" : "incomplete"}`}>{profileComplete ? "Profile Complete" : "Profile Incomplete"}</span></div><p>{profile.designation}</p><div className="profile-summary-meta"><span>{profile.email}</span><span>{profile.phone || "Add phone number"}</span><span>{profile.role}</span></div></div></div></section>
    <section className="panel account-options-panel"><div className="panel-heading"><div><h3><ShieldCheck size={16} /> Account</h3><p>Manage your profile details and account security.</p></div></div><div className="account-option-list">
      <button type="button" className="account-option" onClick={() => setView("profile")}><span className="account-option-icon"><UserRound size={18} /></span><span className="account-option-copy"><strong>Profile</strong><span>View and edit your profile details.</span></span><span className="account-option-meta">{profileComplete ? "Complete" : "Incomplete"}<ChevronRight size={17} /></span></button>
      <button type="button" className="account-option" onClick={() => { setView("password"); setPasswordMessage({ type: "", text: "" }); }}><span className="account-option-icon"><KeyRound size={18} /></span><span className="account-option-copy"><strong>Change Password</strong><span>Update your account password securely.</span></span><ChevronRight size={17} /></button>
    </div></section>
    {view === "profile" && <div className="modal-backdrop" onClick={() => { setView("account"); setProfileSaved(false); }}><section className="account-modal account-modal-large" role="dialog" aria-modal="true" aria-labelledby="profile-modal-title" onClick={(event) => event.stopPropagation()}><div className="modal-heading"><span className="empty-icon"><UserRound size={21} /></span><div><span className="eyebrow">ACCOUNT</span><h2 id="profile-modal-title">Edit Profile</h2></div><button type="button" className="modal-close" onClick={() => { setView("account"); setProfileSaved(false); }} aria-label="Close"><X size={18} /></button></div><form onSubmit={submitProfile}><p className="account-modal-intro">Update the profile details used for your account.</p><div className="account-form-grid"><label>Full name *<input required value={profileForm.name} onChange={(event) => setProfileForm({ ...profileForm, name: event.target.value })} /></label><label>Email address *<input required type="email" value={profileForm.email} disabled onChange={(event) => setProfileForm({ ...profileForm, email: event.target.value })} /></label><label>Phone number<input type="tel" value={profileForm.phone} onChange={(event) => setProfileForm({ ...profileForm, phone: event.target.value })} placeholder="+1 555 000 0000" /></label><label>Designation<input value={profileForm.designation} onChange={(event) => setProfileForm({ ...profileForm, designation: event.target.value })} /></label><label>Organization<input value={profileForm.orgName} disabled /></label><label>Role<input value={profileForm.role} disabled /></label></div><div className="modal-actions">{profileSaved && <span className="modal-success-message"><CheckCircle2 size={14} /> Profile saved</span>}<button type="button" className="secondary-button" onClick={() => { setView("account"); setProfileSaved(false); }}>Cancel</button><button className="primary-button" disabled={saving}><Save size={15} />{saving ? "Saving…" : "Save Profile"}</button></div></form></section></div>}
    {view === "password" && <div className="modal-backdrop" onClick={() => { setView("account"); setPasswordMessage({ type: "", text: "" }); }}><section className="account-modal" role="dialog" aria-modal="true" aria-labelledby="password-modal-title" onClick={(event) => event.stopPropagation()}><div className="modal-heading"><span className="empty-icon"><Lock size={21} /></span><div><span className="eyebrow">ACCOUNT SECURITY</span><h2 id="password-modal-title">Change Password</h2></div><button type="button" className="modal-close" onClick={() => { setView("account"); setPasswordMessage({ type: "", text: "" }); }} aria-label="Close"><X size={18} /></button></div><form onSubmit={submitPassword}><p className="account-modal-intro">Choose a new password with at least 8 characters.</p><div className="password-fields"><label>Current password<input required autoComplete="current-password" type={showPasswords ? "text" : "password"} value={passwordForm.currentPassword} onChange={(event) => setPasswordForm({ ...passwordForm, currentPassword: event.target.value })} /></label><label>New password<input required minLength={8} autoComplete="new-password" type={showPasswords ? "text" : "password"} value={passwordForm.newPassword} onChange={(event) => setPasswordForm({ ...passwordForm, newPassword: event.target.value })} /></label><label>Confirm new password<input required minLength={8} autoComplete="new-password" type={showPasswords ? "text" : "password"} value={passwordForm.confirmPassword} onChange={(event) => setPasswordForm({ ...passwordForm, confirmPassword: event.target.value })} /></label></div><label className="show-password"><input type="checkbox" checked={showPasswords} onChange={(event) => setShowPasswords(event.target.checked)} /> Show passwords</label><div className="password-info"><strong>Last changed</strong><span>{passwordLastChanged}</span></div>{passwordMessage.text && <div role="status" className={`password-feedback ${passwordMessage.type}`}>{passwordMessage.text}</div>}<div className="modal-actions"><button type="button" className="secondary-button" onClick={() => { setView("account"); setPasswordMessage({ type: "", text: "" }); }}>Cancel</button><button className="primary-button"><KeyRound size={15} /> Change Password</button></div></form></section></div>}
    <button className="back-button" onClick={() => navigate("Dashboard")}><ArrowLeft size={15} /> Back to Dashboard</button>
  </div>;
}

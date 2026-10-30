import { useState, useEffect } from "react";
import { auth } from "../../firebase.js";
import { onAuthStateChanged, EmailAuthProvider, reauthenticateWithCredential, updatePassword } from "firebase/auth";
import { LockKeyhole, UserRound } from "lucide-react";
import FormModal from "../../components/common/FormModal.jsx";
import DetailSection from "../../components/common/DetailSection.jsx";
import DetailField from "../../components/common/DetailField.jsx";
import StatusBadge from "../../components/common/StatusBadge.jsx";
import "./SalesProfile.css";

const API_BASE_URL = (import.meta.env.VITE_API_URL || "http://localhost:5000")
  .replace(/\/api\/v1.*$/, "")
  .replace(/\/$/, "");
const SALES_API_URL = `${API_BASE_URL}/api/v1/sales`;

function SalesProfile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");
  const [profileValues, setProfileValues] = useState({ firstName: "", lastName: "", phone: "" });
  const [showProfileForm, setShowProfileForm] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [profileMessage, setProfileMessage] = useState("");
  const [passwordValues, setPasswordValues] = useState({ current: "", next: "", confirm: "" });
  const [passwordError, setPasswordError] = useState(null);
  const [passwordMessage, setPasswordMessage] = useState("");

  const fetchProfile = async () => {
    setLoading(true);
    setFetchError("");
    try {
      const idToken = await auth.currentUser.getIdToken();
      const response = await fetch(`${SALES_API_URL}/profile`, {
        headers: { Authorization: `Bearer ${idToken}` },
      });
      if (!response.ok) throw new Error(`Failed to load profile (${response.status})`);
      const json = await response.json();
      setProfile(json.data);
    } catch (err) {
      setFetchError(err.message || "Failed to load profile.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) fetchProfile();
      else setLoading(false);
    });
    return unsubscribe;
  }, []);

  const fullName = profile ? `${profile.firstName} ${profile.lastName || ""}`.trim() : "";
  const initials = profile
    ? `${profile.firstName?.[0] || ""}${profile.lastName?.[0] || ""}`.toUpperCase()
    : "";
  const formatDate = (value) => {
    const date = new Date(value);
    return value && !Number.isNaN(date.getTime())
      ? date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })
      : "Not available";
  };

  const openPasswordForm = () => {
    setPasswordError(null);
    setPasswordMessage("");
    setShowPasswordForm(true);
  };

  const closePasswordForm = () => {
    setPasswordValues({ current: "", next: "", confirm: "" });
    setPasswordError(null);
    setPasswordMessage("");
    setShowPasswordForm(false);
  };

  const saveProfile = async (event) => {
    event.preventDefault();
    if (!profileValues.firstName.trim()) {
      setProfileError("First name is required.");
      return;
    }
    setProfileError("");
    try {
      const idToken = await auth.currentUser.getIdToken();
      const response = await fetch(`${SALES_API_URL}/profile`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          firstName: profileValues.firstName.trim(),
          lastName: profileValues.lastName.trim(),
          phone: profileValues.phone.trim(),
        }),
      });
      if (!response.ok) throw new Error("Failed to update profile.");
      await fetchProfile();
      setShowProfileForm(false);
      setProfileMessage("Profile updated successfully.");
    } catch (err) {
      setProfileError(err.message || "Failed to save profile.");
    }
  };

  const validatePassword = async (event) => {
    event.preventDefault();
    setPasswordMessage("");
    if (!passwordValues.current) {
      setPasswordError({ field: "current", message: "Enter your current password." });
    } else if (!passwordValues.next) {
      setPasswordError({ field: "next", message: "Enter a new password." });
    } else if (!passwordValues.confirm) {
      setPasswordError({ field: "confirm", message: "Confirm your new password." });
    } else if (passwordValues.next.length < 6) {
      setPasswordError({ field: "next", message: "New password must be at least 6 characters." });
    } else if (passwordValues.next !== passwordValues.confirm) {
      setPasswordError({ field: "confirm", message: "New password and confirmation do not match." });
    } else if (passwordValues.next === passwordValues.current) {
      setPasswordError({ field: "next", message: "New password must be different from the current password." });
    } else {
      setPasswordError(null);
      try {
        const user = auth.currentUser;
        const credential = EmailAuthProvider.credential(user.email, passwordValues.current);
        await reauthenticateWithCredential(user, credential);
        await updatePassword(user, passwordValues.next);
        setPasswordMessage("Password updated successfully.");
        setPasswordValues({ current: "", next: "", confirm: "" });
      } catch (err) {
        if (err.code === "auth/wrong-password" || err.code === "auth/invalid-credential") {
          setPasswordError({ field: "current", message: "Current password is incorrect." });
        } else {
          setPasswordError({ field: "current", message: err.message || "Failed to update password." });
        }
      }
    }
  };

  if (loading) return <div className="sales-profile-page"><p className="sales-form-loading">Loading profile…</p></div>;
  if (fetchError) return <div className="sales-profile-page"><p className="sales-form-error" role="alert">{fetchError}</p></div>;
  if (!profile) return null;

  return (
    <div className="sales-profile-page">
      <header className="sales-profile-page-heading">
        <h1>My Profile</h1>
        <p>Manage your personal information, work details and account security.</p>
      </header>

      {profileMessage && <p className="sales-profile-message" role="status">{profileMessage}</p>}

      <section className="sales-profile-card" aria-label="My profile">
        <div className="sales-profile-header">
          <div className="sales-profile-avatar">{initials || <UserRound size={30} strokeWidth={1.7} />}</div>
          <div className="sales-profile-identity">
            <h2>{fullName}</h2>
            <div className="sales-profile-badges">
              <StatusBadge status={profile.role} variant="info" />
              <span className="sales-profile-organization-name">{profile.organizationName}</span>
              <StatusBadge status={profile.accountStatus} variant="success" />
            </div>
            <p>{profile.email}</p>
          </div>
          <div className="sales-profile-actions">
            <button className="sales-profile-edit" type="button" onClick={() => { setProfileValues({ firstName: profile.firstName, lastName: profile.lastName || "", phone: profile.phone || "" }); setProfileError(""); setProfileMessage(""); setShowProfileForm(true); }}>Edit Profile</button>
          </div>
        </div>
      </section>

      <div className="sales-profile-sections">
          <DetailSection title="Personal Information" className="sales-profile-information">
            <div className="sales-profile-fields">
              <DetailField label="First Name" value={profile.firstName} />
              <DetailField label="Last Name" value={profile.lastName} />
              <DetailField label="Work Email" value={profile.email} />
              <DetailField label="Phone Number" value={profile.phone} />
            </div>
          </DetailSection>

          <DetailSection title="Organisation Information" className="sales-profile-information">
            <div className="sales-profile-fields">
              <DetailField label="Organisation Name" value={profile.organizationName} />
              <DetailField label="Organisation Email" value={profile.organizationEmail} />
              <DetailField label="Organisation Phone" value={profile.organizationPhone} />
              <DetailField label="Organisation Website" value={profile.organizationWebsite} />
            </div>
          </DetailSection>

          <DetailSection title="Work & Team Information" className="sales-profile-information">
            <div className="sales-profile-fields">
              <DetailField label="Role" value={profile.role} />
              <DetailField label="Team" value={profile.team} />
            </div>
          </DetailSection>

          <DetailSection title="Account Information" className="sales-profile-information">
            <div className="sales-profile-fields">
              <DetailField label="Account Status" value={<StatusBadge status={profile.accountStatus} variant="success" />} />
              <DetailField label="Member Since" value={formatDate(profile.accountCreated)} />
              <DetailField label="Last Updated" value={formatDate(profile.lastUpdated)} />
            </div>
          </DetailSection>
      </div>
      <section className="sales-profile-security" aria-label="Password and security">
        <div className="sales-profile-security-icon"><LockKeyhole size={18} /></div>
        <div className="sales-profile-security-copy">
          <h2>Password &amp; Security</h2>
          <p>Keep your account secure.</p>
        </div>
        <button className="sales-profile-password-button" type="button" onClick={openPasswordForm}>Update Password</button>
      </section>

      {showProfileForm && (
        <form onSubmit={saveProfile} noValidate>
          <FormModal
            title="Edit Profile"
            onClose={() => setShowProfileForm(false)}
            actions={<><button className="form-modal-cancel" type="button" onClick={() => setShowProfileForm(false)}>Cancel</button><button className="form-modal-submit" type="submit">Save Changes</button></>}
          >
            <label className="sales-form-field">First Name *<input autoFocus value={profileValues.firstName} onChange={(event) => setProfileValues({ ...profileValues, firstName: event.target.value })} /></label>
            <label className="sales-form-field">Last Name<input value={profileValues.lastName} onChange={(event) => setProfileValues({ ...profileValues, lastName: event.target.value })} /></label>
            <label className="sales-form-field">Phone Number<input type="tel" value={profileValues.phone} onChange={(event) => setProfileValues({ ...profileValues, phone: event.target.value })} /></label>
            {profileError && <p className="sales-form-error" role="alert">{profileError}</p>}
          </FormModal>
        </form>
      )}

      {showPasswordForm && (
        <form onSubmit={validatePassword} noValidate>
          <FormModal
            title="Update Password"
            onClose={closePasswordForm}
            actions={<><button className="form-modal-cancel" type="button" onClick={closePasswordForm}>Cancel</button><button className="form-modal-submit" type="submit">Update Password</button></>}
          >
            <label className="sales-form-field">Current Password *<input type="password" value={passwordValues.current} onChange={(event) => setPasswordValues({ ...passwordValues, current: event.target.value })} /></label>
            {passwordError?.field === "current" && <p className="sales-form-error" role="alert">{passwordError.message}</p>}
            <label className="sales-form-field">New Password *<input type="password" value={passwordValues.next} onChange={(event) => setPasswordValues({ ...passwordValues, next: event.target.value })} /></label>
            {passwordError?.field === "next" && <p className="sales-form-error" role="alert">{passwordError.message}</p>}
            <label className="sales-form-field">Confirm New Password *<input type="password" value={passwordValues.confirm} onChange={(event) => setPasswordValues({ ...passwordValues, confirm: event.target.value })} /></label>
            {passwordError?.field === "confirm" && <p className="sales-form-error" role="alert">{passwordError.message}</p>}
            {passwordMessage && <p className="sales-profile-message sales-profile-password-notice" role="status">{passwordMessage}</p>}
          </FormModal>
        </form>
      )}
    </div>
  );
}

export default SalesProfile;

import { useEffect, useState } from "react";
import { UserRound } from "lucide-react";
import { onAuthStateChanged } from "firebase/auth";
import FormModal from "../../components/common/FormModal.jsx";
import DetailSection from "../../components/common/DetailSection.jsx";
import DetailField from "../../components/common/DetailField.jsx";
import StatusBadge from "../../components/common/StatusBadge.jsx";
import { auth } from "../../firebase.js";
import "./SalesProfile.css";

function SalesProfile() {
  const [user, setUser] = useState(auth.currentUser);
  const [profile, setProfile] = useState({ firstName: "", lastName: "", phone: "" });
  const [profileValues, setProfileValues] = useState({ firstName: "", lastName: "", phone: "" });
  const [showProfileForm, setShowProfileForm] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [profileMessage, setProfileMessage] = useState("");
  const [accountDetails, setAccountDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(true);
  const [passwordValues, setPasswordValues] = useState({ current: "", next: "", confirm: "" });
  const [passwordError, setPasswordError] = useState(null);
  const [passwordMessage, setPasswordMessage] = useState("");

  useEffect(() => onAuthStateChanged(auth, async (currentUser) => {
    setUser(currentUser);
    const nameParts = (currentUser?.displayName || "").trim().split(/\s+/).filter(Boolean);
    setProfile({
      firstName: nameParts[0] || "",
      lastName: nameParts.slice(1).join(" "),
      phone: currentUser?.phoneNumber || "",
    });
    setAccountDetails(null);
    if (!currentUser) {
      setDetailsLoading(false);
      return;
    }
    setDetailsLoading(true);
    try {
      const token = await currentUser.getIdToken();
      const response = await fetch("http://localhost:5000/api/v1/auth/protected", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Profile information is unavailable.");
      const data = result.data;
      setAccountDetails({
        firstName: data.firstName || "",
        lastName: data.lastName || "",
        role: data.role || "",
        status: data.status || "",
        createdAt: data.createdAt || "",
        updatedAt: data.updatedAt || "",
        organization: data.organization ? {
          name: data.organization.name || "",
          email: data.organization.email || "",
          phone: data.organization.phone || "",
          website: data.organization.website || "",
        } : null,
      });
      setProfile((currentProfile) => ({
        ...currentProfile,
        firstName: data.firstName || currentProfile.firstName,
        lastName: data.lastName || currentProfile.lastName,
      }));
    } catch {
      setAccountDetails(null);
    } finally {
      setDetailsLoading(false);
    }
  }), []);

  const fullName = [profile.firstName, profile.lastName].filter(Boolean).join(" ") || "Not available";
  const initials = [profile.firstName[0], profile.lastName[0]].filter(Boolean).join("").toUpperCase();
  const displayRole = "Sales Executive";
  const formatDate = (value) => {
    if (!value) return "Not available";
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? "Not available" : date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
  };

  const closePasswordForm = () => {
    setPasswordValues({ current: "", next: "", confirm: "" });
    setPasswordError(null);
    setPasswordMessage("");
    setShowPasswordForm(false);
  };

  const saveProfile = (event) => {
    event.preventDefault();
    if (!profileValues.firstName.trim()) {
      setProfileError("First name is required.");
      return;
    }
    setProfile((currentProfile) => ({
      ...currentProfile,
      firstName: profileValues.firstName.trim(),
      lastName: profileValues.lastName.trim(),
      phone: profileValues.phone.trim(),
    }));
    setProfileError("");
    setShowProfileForm(false);
    setProfileMessage("Profile preview updated for this session only. Changes are not saved permanently.");
  };

  const validatePassword = (event) => {
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
      setPasswordMessage("Password updates are not connected yet. No password was changed.");
    }
  };

  return (
    <div className="sales-profile-page">
      <header className="sales-profile-page-heading">
        <h1>My Profile</h1>
        <p>View and manage your personal information.</p>
      </header>

      {profileMessage && <p className="sales-profile-message" role="status">{profileMessage}</p>}

      <section className="sales-profile-card" aria-label="My profile">
        <div className="sales-profile-header">
          <div className="sales-profile-avatar">{initials || <UserRound size={27} strokeWidth={1.7} />}</div>
          <div className="sales-profile-identity">
            <h2>{fullName}</h2>
            <div className="sales-profile-badges">
              <StatusBadge status={displayRole} variant="info" />
              {accountDetails?.organization?.name && <span className="sales-profile-organization-name">{accountDetails.organization.name}</span>}
            </div>
            <p>{user?.email || "Not available"}</p>
          </div>
          <div className="sales-profile-actions">
            <button className="sales-profile-edit" type="button" onClick={() => { setProfileValues({ ...profile }); setProfileError(""); setProfileMessage(""); setShowProfileForm(true); }}>Edit Profile</button>
            <button className="sales-profile-password-button" type="button" onClick={() => { setPasswordError(null); setPasswordMessage(""); setShowPasswordForm(true); }}>Update Password</button>
          </div>
        </div>

        <div className="sales-profile-sections">
          <DetailSection title="Personal Information" className="sales-profile-information">
            <div className="sales-profile-fields">
              <DetailField label="First Name" value={profile.firstName} emptyValue="Not available" />
              <DetailField label="Last Name" value={profile.lastName} emptyValue="Not available" />
              <DetailField label="Email Address" value={user?.email} emptyValue="Not available" />
              <DetailField label="Phone Number" value={profile.phone} emptyValue="Not available" />
            </div>
          </DetailSection>

          <DetailSection title="Organisation Information" className="sales-profile-information">
            {detailsLoading ? <p className="sales-profile-unavailable">Loading organisation information…</p> : accountDetails?.organization ? (
              <div className="sales-profile-fields">
                <DetailField label="Organisation Name" value={accountDetails.organization.name} emptyValue="Not available" />
                <DetailField label="Official Email" value={accountDetails.organization.email} emptyValue="Not available" />
                <DetailField label="Contact Phone" value={accountDetails.organization.phone} emptyValue="Not available" />
                <DetailField label="Website" value={accountDetails.organization.website} emptyValue="Not available" />
              </div>
            ) : <p className="sales-profile-unavailable">Organisation information is not available.</p>}
          </DetailSection>

          <DetailSection title="Work and Team Information" className="sales-profile-information">
            <div className="sales-profile-fields">
              <DetailField label="Role" value={displayRole} />
              <DetailField label="Account Status" value={accountDetails?.status ? <StatusBadge status={accountDetails.status} variant={accountDetails.status === "ACTIVE" ? "success" : "neutral"} /> : null} emptyValue={detailsLoading ? "Loading…" : "Not available"} />
              <DetailField label="Team" value={detailsLoading ? "Loading…" : "Not available"} />
            </div>
          </DetailSection>

          <DetailSection title="Account Information" className="sales-profile-information">
            <div className="sales-profile-fields">
              <DetailField label="Account Created" value={formatDate(accountDetails?.createdAt)} />
              <DetailField label="Last Updated" value={formatDate(accountDetails?.updatedAt)} />
            </div>
          </DetailSection>
          </div>
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

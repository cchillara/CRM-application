import { ArrowLeft, Download, Pencil, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Modal from "../components/Modal";
import Status from "../components/Status";
import { superAdminDownload } from "../api/superAdminApi";
import { usePlatform } from "../context/PlatformContext";

export default function OrganizationDetails() {
  const { organizationId } = useParams();
  const navigate = useNavigate();
  const {
    data,
    updateUser,
    deleteUser,
    updateOrganization,
    deleteOrganization
  } = usePlatform();

  const organization = data.organizations.find((org) => org.id === organizationId);

  const [editOrgOpen, setEditOrgOpen] = useState(false);
  const [editUserId, setEditUserId] = useState(null);
  const [userForm, setUserForm] = useState({
    name: "",
    email: "",
    phone: "",
    role: "SALES_REP",
    status: "Active"
  });
  const [orgForm, setOrgForm] = useState(null);
  const [actionError, setActionError] = useState("");
  const [savingOrg, setSavingOrg] = useState(false);
  const [savingUser, setSavingUser] = useState(false);
  const [exportingCsv, setExportingCsv] = useState(false);

  const editingUser = useMemo(
    () => organization?.users.find((user) => user.id === editUserId) || null,
    [organization, editUserId]
  );

  if (!organization) {
    return (
      <section className="panel">
        <h3>Organization not found</h3>
        <button className="text-button" onClick={() => navigate("/organizations")}>
          Back to organizations
        </button>
      </section>
    );
  }

  const plan = data.plans.find((item) => item.id === organization.planId);

  async function exportCsv() {
    if (exportingCsv) return;
    setActionError("");
    setExportingCsv(true);
    try {
      const filename = `${organization.name.replace(/\s+/g, "-").toLowerCase()}-users.csv`;
      await superAdminDownload(`/organizations/${encodeURIComponent(organization.id)}/users/export`, filename);
    } catch (error) {
      setActionError(error.message || "Could not export organization users.");
    } finally {
      setExportingCsv(false);
    }
  }

  function openEditOrganization() {
    setOrgForm({
      name: organization.name,
      status: organization.status,
      planId: organization.planId,
      subscriptionStatus: organization.subscriptionStatus,
      paymentStatus: organization.paymentStatus,
      adminName: organization.admin?.isContactOnly ? "" : organization.admin?.name || "",
      adminEmail: organization.admin?.email === "-" ? "" : organization.admin?.email || "",
      adminPhone: organization.admin?.phone === "-" ? "" : organization.admin?.phone || "",
      adminUserId: organization.users?.find((user) => user.role === "ORG_ADMIN")?.id || ""
    });
    setEditOrgOpen(true);
  }

  async function submitOrganizationEdit(event) {
    event.preventDefault();
    if (savingOrg) return;
    setActionError("");
    setSavingOrg(true);
    try {
      await updateOrganization(organization.id, orgForm);
      setEditOrgOpen(false);
    } catch (error) {
      setActionError(error.message || "Could not update the organization.");
    } finally {
      setSavingOrg(false);
    }
  }

  async function removeOrganization() {
    const confirmed = window.confirm(
      `Delete ${organization.name}? This will also remove its existing users and support queries.`
    );
    if (!confirmed) return;

    setActionError("");
    try {
      await deleteOrganization(organization.id);
      navigate("/organizations");
    } catch (error) {
      setActionError(error.message || "Could not delete the organization.");
    }
  }

  function openEditUser(user) {
    setEditUserId(user.id);
    setUserForm({
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      status: user.status
    });
  }

  async function submitEditUser(event) {
    event.preventDefault();
    if (savingUser) return;
    setActionError("");
    setSavingUser(true);
    try {
      await updateUser(organization.id, editUserId, userForm);
      setEditUserId(null);
    } catch (error) {
      setActionError(error.message || "Could not update the user.");
    } finally {
      setSavingUser(false);
    }
  }

  async function removeUser(user) {
    const confirmed = window.confirm(
      `Delete ${user.name} from ${organization.name}?`
    );
    if (!confirmed) return;

    setActionError("");
    try {
      await deleteUser(organization.id, user.id);
      if (editUserId === user.id) setEditUserId(null);
    } catch (error) {
      setActionError(error.message || "Could not delete the user.");
    }
  }

  return (
    <>
      {actionError && <div className="inline-error" role="alert">{actionError}</div>}
      <div className="details-heading">
        <button className="back-button" onClick={() => navigate("/organizations")}>
          <ArrowLeft size={16} />
          Back
        </button>

        <div className="details-actions">
          <button className="secondary-button" onClick={exportCsv} disabled={exportingCsv}>
            <Download size={16} />
            {exportingCsv ? "Exporting…" : "Export CSV"}
          </button>

          <button className="secondary-button" onClick={openEditOrganization}>
            <Pencil size={16} />
            Edit Organization
          </button>

          <button className="danger-button" onClick={removeOrganization}>
            <Trash2 size={16} />
            Delete Organization
          </button>
        </div>
      </div>

      <section className="panel org-title-panel">
        <div>
          <h2>{organization.name}</h2>
          <p>
            Joined {organization.joined}
          </p>
        </div>
        <Status value={organization.status} />
      </section>

      <section className="detail-cards">
        <div className="detail-card">
          <span>Plan</span>
          <strong>{plan?.name || "-"}</strong>
          <small>{plan ? `₹${plan.price.toLocaleString("en-IN")} / month` : "No plan"}</small>
        </div>

        <div className="detail-card">
          <span>Users</span>
          <strong>{organization.users.length}</strong>
          <small>Existing users in this organization</small>
        </div>

        <div className="detail-card">
          <span>Subscription</span>
          <strong>{organization.subscriptionStatus}</strong>
          <small>Current subscription status</small>
        </div>

        <div className="detail-card">
          <span>Payment</span>
          <strong>{organization.paymentStatus}</strong>
          <small>Current payment status</small>
        </div>
      </section>

      <section className="panel organization-admin-panel">
        <div className="panel-title">
          <div>
            <h3>Organization Admin</h3>
            <p>Primary organization contact</p>
          </div>
        </div>

        <div className="admin-details-grid">
          <div><span>Name</span><strong>{organization.admin?.name || "-"}</strong></div>
          <div><span>Email</span><strong>{organization.admin?.email || "-"}</strong></div>
          <div><span>Phone</span><strong>{organization.admin?.phone || "-"}</strong></div>
        </div>
      </section>

      <section className="panel users-panel">
        <div className="panel-title">
          <div>
            <h3>Organization Users</h3>
            <p>Super Admin can edit or delete existing users. User creation is handled by the organization.</p>
          </div>
          <span className="record-count">{organization.users.length} users</span>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>User</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Role</th>
                <th>Status</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {organization.users.map((user) => (
                <tr key={user.id}>
                  <td>
                    <strong>{user.name}</strong>
                  </td>
                  <td>{user.email}</td>
                  <td>{user.phone}</td>
                  <td>{user.role}</td>
                  <td><Status value={user.status} /></td>
                  <td>{user.joined}</td>
                  <td>
                    <div className="row-actions">
                      <button
                        className="table-action"
                        onClick={() => openEditUser(user)}
                      >
                        <Pencil size={14} />
                        Edit
                      </button>

                      <button
                        className="table-action danger-text"
                        onClick={() => removeUser(user)}
                      >
                        <Trash2 size={14} />
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {organization.users.length === 0 && (
                <tr>
                  <td colSpan="7" className="empty-cell">
                    No users in this organization.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <Modal
        open={Boolean(editingUser)}
        title={editingUser ? `Edit User · ${editingUser.name}` : "Edit User"}
        onClose={() => setEditUserId(null)}
      >
        <form className="form-stack" onSubmit={submitEditUser}>
          <label>
            Name
            <input
              required
              value={userForm.name}
              onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
            />
          </label>

          <div className="form-grid">
            <label>
              Email
              <input
                required
                type="email"
                value={userForm.email}
                onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
              />
            </label>

            <label>
              Phone
              <input
                required
                value={userForm.phone}
                onChange={(e) => setUserForm({ ...userForm, phone: e.target.value })}
              />
            </label>
          </div>

          <div className="form-grid">
            <label>
              Role
              <select
                value={userForm.role}
                onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
              >
                <option value="ORG_ADMIN">ORG_ADMIN</option>
                <option value="MANAGER">MANAGER</option>
                <option value="SALES_REP">SALES_REP</option>
              </select>
            </label>

            <label>
              Status
              <select
                value={userForm.status}
                onChange={(e) => setUserForm({ ...userForm, status: e.target.value })}
              >
                <option>Active</option>
                <option>Pending</option>
                <option>Suspended</option>
              </select>
            </label>
          </div>

          <div className="modal-actions">
            <button
              type="button"
              className="secondary-button"
              onClick={() => setEditUserId(null)}
            >
              Cancel
            </button>
            <button type="submit" className="primary-button" disabled={savingUser}>
              {savingUser ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        open={editOrgOpen}
        title={`Edit Organization · ${organization.name}`}
        onClose={() => setEditOrgOpen(false)}
        size="large"
      >
        {orgForm && (
          <form className="form-stack" onSubmit={submitOrganizationEdit}>
            {actionError && <div className="inline-error" role="alert">{actionError}</div>}
            <div className="form-grid">
              <label>
                Organization name
                <input
                  required
                  value={orgForm.name}
                  onChange={(e) => setOrgForm({ ...orgForm, name: e.target.value })}
                />
              </label>

              <label>
                Organization status
                <select
                  value={orgForm.status}
                  onChange={(e) => setOrgForm({ ...orgForm, status: e.target.value })}
                >
                  <option>Active</option>
                  <option>Suspended</option>
                  <option>Deactivated</option>
                </select>
              </label>
            </div>

            <div className="form-grid">
              <label>
                Plan
                <select
                  value={orgForm.planId}
                  onChange={(e) => setOrgForm({ ...orgForm, planId: e.target.value })}
                >
                  {data.plans.map((item) => (
                    <option key={item.id} value={item.id}>{item.name}</option>
                  ))}
                </select>
              </label>

              <label>
                Subscription status
                <select
                  value={orgForm.subscriptionStatus}
                  onChange={(e) => setOrgForm({ ...orgForm, subscriptionStatus: e.target.value })}
                >
                  <option>Active</option>
                  <option>Pending</option>
                  <option>Inactive</option>
                </select>
              </label>
            </div>

            <label>
              Payment status
              <select
                value={orgForm.paymentStatus}
                onChange={(e) => setOrgForm({ ...orgForm, paymentStatus: e.target.value })}
              >
                <option>Paid</option>
                <option>Payment Pending</option>
                <option>Unpaid</option>
                <option>Failed</option>
              </select>
            </label>

            <div className="form-grid">
              <label>
                Admin name
                <input
                  value={orgForm.adminName}
                  onChange={(e) => setOrgForm({ ...orgForm, adminName: e.target.value })}
                />
              </label>

              <label>
                Admin email
                <input
                  type="email"
                  value={orgForm.adminEmail}
                  onChange={(e) => setOrgForm({ ...orgForm, adminEmail: e.target.value })}
                />
              </label>
            </div>

            <label>
              Admin phone
              <input
                value={orgForm.adminPhone}
                onChange={(e) => setOrgForm({ ...orgForm, adminPhone: e.target.value })}
              />
            </label>

            <div className="modal-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={() => setEditOrgOpen(false)}
              >
                Cancel
              </button>
              <button type="submit" className="primary-button" disabled={savingOrg}>
                {savingOrg ? "Saving…" : "Save Organization"}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </>
  );
}

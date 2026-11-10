import { Building, Calendar, DollarSign, Pencil, Phone, Plus, Search, Trash2, User, Users } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Modal from "../components/Modal";
import DetailPopup from "../components/DetailPopup";
import Status from "../components/Status";
import { usePlatform } from "../context/PlatformContext";
import { superAdminRequest } from "../api/superAdminApi";

export default function Organizations() {
  const navigate = useNavigate();
  const {
    data,
    refreshData,
    addUser,
    assignUser,
    updateOrganization,
    deleteOrganization
  } = usePlatform();

  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [viewingOrg, setViewingOrg] = useState(null);
  const [popupTab, setPopupTab] = useState("details");
  const [editOrgId, setEditOrgId] = useState(null);
  const [editForm, setEditForm] = useState(null);
  const [actionError, setActionError] = useState("");
  const [savingCreate, setSavingCreate] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);

  const [form, setForm] = useState({
    name: "",
    adminName: "",
    adminEmail: "",
    adminPhone: "",
    adminPassword: "",
    planId: data.settings.defaultPlanId
  });

  const organizationUsers = data.organizations.flatMap((org) => org.users || []);
  const existingUsers = [...data.unassignedUsers, ...organizationUsers]
    .filter((user, index, users) => users.findIndex((item) => item.id === user.id) === index);
  const matchingCreateAdmin = existingUsers.find(
    (user) => user.email?.trim().toLowerCase() === form.adminEmail.trim().toLowerCase()
  );

  const filtered = useMemo(
    () =>
      data.organizations.filter((org) =>
        `${org.name} ${org.id} ${org.admin?.name || ""} ${org.admin?.email || ""}`
          .toLowerCase()
          .includes(search.toLowerCase())
      ),
    [data.organizations, search]
  );

  async function submit(event) {
    event.preventDefault();
    if (savingCreate) return;
    setActionError("");
    if (!matchingCreateAdmin && form.adminPassword.length < 8) {
      setActionError("Enter a temporary admin password with at least 8 characters.");
      return;
    }
    setSavingCreate(true);
    try {
      const organization = await superAdminRequest("/organizations", {
        method: "POST",
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.adminEmail.trim() || null,
          phone: form.adminPhone.trim() || null
        })
      });
      if (matchingCreateAdmin) {
        await assignUser(matchingCreateAdmin.id, organization.id, "ORG_ADMIN");
      } else {
        await addUser(organization.id, {
          name: form.adminName,
          email: form.adminEmail,
          password: form.adminPassword,
          role: "ORG_ADMIN"
        });
      }
      const plan = data.plans.find((item) => item.id === form.planId);
      if (plan) {
        await superAdminRequest(`/organizations/${organization.id}`, {
          method: "PUT",
          body: JSON.stringify({
            planId: plan.id,
            billingCycle: plan.billing,
            subscriptionAmount: plan.price
          })
        });
      }
      await refreshData();
      setOpen(false);
      setForm({
        name: "",
        adminName: "",
        adminEmail: "",
        adminPhone: "",
        adminPassword: "",
        planId: data.settings.defaultPlanId
      });
      navigate(`/organizations/${organization.id}`);
    } catch (error) {
      setActionError(error.message || "Could not create the organization.");
    } finally {
      setSavingCreate(false);
    }
  }

  function openEdit(org, event) {
    event.stopPropagation();
    setEditOrgId(org.id);
    setEditForm({
      name: org.name,
      status: org.status,
      planId: org.planId,
      subscriptionStatus: org.subscriptionStatus,
      paymentStatus: org.paymentStatus,
      adminName: org.admin?.isContactOnly ? "" : org.admin?.name || "",
      adminEmail: org.admin?.email === "-" ? "" : org.admin?.email || "",
      adminPhone: org.admin?.phone === "-" ? "" : org.admin?.phone || "",
      currentAdminId: org.users?.find((user) => user.role === "ORG_ADMIN")?.id || "",
      adminUserId: org.users?.find((user) => user.role === "ORG_ADMIN")?.id || "",
      adminPassword: ""
    });
  }

  async function submitEdit(event) {
    event.preventDefault();
    if (savingEdit) return;
    setActionError("");
    const matchingAdmin = existingUsers.find(
      (user) => user.email?.trim().toLowerCase() === editForm.adminEmail.trim().toLowerCase()
    );
    if (!editForm.currentAdminId && !matchingAdmin && editForm.adminPassword.length < 8) {
      setActionError("Enter a temporary admin password with at least 8 characters.");
      return;
    }
    setSavingEdit(true);
    try {
      await updateOrganization(editOrgId, editForm);
      if (!editForm.currentAdminId) {
        if (matchingAdmin) {
          await assignUser(matchingAdmin.id, editOrgId, "ORG_ADMIN");
        } else {
          await addUser(editOrgId, {
            name: editForm.adminName,
            email: editForm.adminEmail,
            password: editForm.adminPassword,
            role: "ORG_ADMIN"
          });
        }
      }
      setEditOrgId(null);
      setEditForm(null);
    } catch (error) {
      setActionError(error.message || "Could not update the organization.");
    } finally {
      setSavingEdit(false);
    }
  }

  function removeOrg(org, event) {
    event.stopPropagation();

    const confirmed = window.confirm(
      `Delete ${org.name}? This will remove its existing users and support queries.`
    );
    if (!confirmed) return;

    setActionError("");
    deleteOrganization(org.id).catch((error) => {
      setActionError(error.message || "Could not delete the organization.");
    });
  }

  return (
    <>
      <section className="panel page-panel">
        {actionError && <div className="inline-error" role="alert">{actionError}</div>}
        <div className="page-actions">
          <div className="search-box">
            <Search size={16} />
            <input
              placeholder="Search organizations..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <button className="primary-button" onClick={() => setOpen(true)}>
            <Plus size={16} />
            Add Organization
          </button>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Organization</th>
                <th>Admin</th>
                <th>Plan</th>
                <th>Users</th>
                <th>Subscription</th>
                <th>Payment</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {filtered.map((org) => {
                const plan = data.plans.find((item) => item.id === org.planId);

                return (
                  <tr
                    key={org.id}
                    onClick={() => setViewingOrg(org)}
                    style={{ cursor: "pointer" }}
                  >
                    <td>
                      <strong>{org.name}</strong>
                    </td>

                    <td>
                      <strong>{org.admin?.name || "-"}</strong>
                      <span>{org.admin?.email || "-"}</span>
                    </td>

                    <td>{plan?.name || "-"}</td>
                    <td>{org.users.length}</td>
                    <td><Status value={org.subscriptionStatus} /></td>
                    <td><Status value={org.paymentStatus} /></td>
                    <td><Status value={org.status} /></td>

                    <td>
                      <div className="row-actions">
                        <button
                          className="table-action"
                          onClick={(e) => openEdit(org, e)}
                        >
                          <Pencil size={14} />
                          Edit
                        </button>

                        <button
                          className="table-action danger-text"
                          onClick={(e) => removeOrg(org, e)}
                        >
                          <Trash2 size={14} />
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan="8" className="empty-cell">
                    No organizations found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Organization Details Popup Dialog in exact screenshot format */}
      <DetailPopup
        isOpen={Boolean(viewingOrg)}
        onClose={() => setViewingOrg(null)}
        title={viewingOrg?.name}
        tier={(() => {
          const p = data.plans.find((item) => item.id === viewingOrg?.planId);
          return p ? p.name.replace(/ plan$/i, "") : "Enterprise";
        })()}
        phone={viewingOrg?.admin?.phone || "+91 98111 22233"}
        tabs={[
          { id: "details", label: "Organization Details", icon: Building },
          { id: "users", label: "Team Members", icon: Users, badge: viewingOrg?.users?.length || 0 },
          { id: "admin", label: "Admin Contact", icon: User },
        ]}
        activeTab={popupTab}
        onTabChange={setPopupTab}
        footerActions={
          <>
            <button
              type="button"
              className="secondary-button"
              onClick={() => {
                const orgToEdit = viewingOrg;
                setViewingOrg(null);
                openEdit(orgToEdit, { stopPropagation: () => {} });
              }}
            >
              <Pencil size={14} /> Edit Organization
            </button>
            <button
              type="button"
              className="primary-button"
              onClick={() => {
                const id = viewingOrg.id;
                setViewingOrg(null);
                navigate(`/organizations/${id}`);
              }}
            >
              View Full Details Page
            </button>
            <button
              type="button"
              className="secondary-button"
              onClick={() => setViewingOrg(null)}
            >
              Close
            </button>
          </>
        }
      >
        {viewingOrg && popupTab === "details" && (() => {
          const plan = data.plans.find((item) => item.id === viewingOrg.planId);
          return (
            <section className="crm-slideover-section" aria-label="Organization details">
              <div className="crm-slideover-section-header">
                <div className="crm-slideover-section-title">
                  <Building size={16} />
                  <span>Organization details</span>
                </div>
              </div>

              <div className="crm-lead-details-grid">
                <div className="crm-lead-detail-item crm-lead-detail-full">
                  <span className="crm-lead-detail-label">ORGANIZATION DESCRIPTION</span>
                  <p className="crm-lead-detail-desc">
                    {viewingOrg.name} is registered under the {plan?.name || "Enterprise"} tier with {viewingOrg.users?.length || 0} active team members and primary administrator {viewingOrg.admin?.name || "assigned contact"}.
                  </p>
                </div>

                <div className="crm-lead-detail-item">
                  <span className="crm-lead-detail-label">ID</span>
                  <span className="crm-lead-detail-value">{viewingOrg.id}</span>
                </div>

                <div className="crm-lead-detail-item">
                  <span className="crm-lead-detail-label">
                    <User size={12} /> CONTACT PERSON
                  </span>
                  <span className="crm-lead-detail-value">{viewingOrg.admin?.name || "Rahul Sharma"}</span>
                </div>

                <div className="crm-lead-detail-item">
                  <span className="crm-lead-detail-label">
                    <Phone size={12} /> CONTACT NUMBER
                  </span>
                  <span className="crm-lead-detail-value">{viewingOrg.admin?.phone || "+91 98111 22233"}</span>
                </div>

                <div className="crm-lead-detail-item">
                  <span className="crm-lead-detail-label">
                    <Calendar size={12} /> CREATED DATE
                  </span>
                  <span className="crm-lead-detail-value">{viewingOrg.joined || "10-01-2026"}</span>
                </div>

                <div className="crm-lead-detail-item">
                  <span className="crm-lead-detail-label">STATUS</span>
                  <span className="crm-lead-detail-value">
                    <span className={`crm-status-badge ${viewingOrg.status === "Active" ? "badge-active" : "badge-danger"}`}>
                      {viewingOrg.status || "Active"}
                    </span>
                  </span>
                </div>

                <div className="crm-lead-detail-item">
                  <span className="crm-lead-detail-label">PRIORITY</span>
                  <span className="crm-lead-detail-value">
                    <span className="crm-status-badge badge-pending">
                      {plan?.name?.includes("Enterprise") ? "High" : plan?.name?.includes("Pro") ? "Medium" : "Standard"}
                    </span>
                  </span>
                </div>

                <div className="crm-lead-detail-item">
                  <span className="crm-lead-detail-label">
                    <DollarSign size={12} /> EXPECTED VALUE
                  </span>
                  <span className="crm-lead-detail-value" style={{ color: "#059669", fontWeight: 700 }}>
                    ₹{plan ? plan.price.toLocaleString("en-IN") : "120,000"}
                  </span>
                </div>

                <div className="crm-lead-detail-item">
                  <span className="crm-lead-detail-label">
                    <Users size={12} /> ACTIVE USERS
                  </span>
                  <span className="crm-lead-detail-value">
                    {viewingOrg.users?.length || 0} / {plan?.userLimit || 25} Users
                  </span>
                </div>
              </div>
            </section>
          );
        })()}

        {viewingOrg && popupTab === "users" && (
          <section className="crm-slideover-section" aria-label="Team members">
            <div className="crm-slideover-section-header">
              <div className="crm-slideover-section-title">
                <Users size={16} />
                <span>Team Members ({viewingOrg.users?.length || 0})</span>
              </div>
            </div>
            {viewingOrg.users && viewingOrg.users.length > 0 ? (
              <div className="crm-popup-table-wrap">
                <table className="crm-popup-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {viewingOrg.users.map((user) => (
                      <tr key={user.id}>
                        <td><strong>{user.name}</strong></td>
                        <td>{user.email}</td>
                        <td><span className="crm-status-badge badge-progress">{user.role}</span></td>
                        <td><span className={`crm-status-badge ${user.status === "Active" ? "badge-active" : "badge-pending"}`}>{user.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p style={{ margin: 0, color: "var(--text-muted)", fontSize: "13px" }}>No users registered for this organization yet.</p>
            )}
          </section>
        )}

        {viewingOrg && popupTab === "admin" && (
          <section className="crm-slideover-section" aria-label="Admin contact">
            <div className="crm-slideover-section-header">
              <div className="crm-slideover-section-title">
                <User size={16} />
                <span>Primary Organization Admin</span>
              </div>
            </div>
            <div className="crm-lead-details-grid">
              <div className="crm-lead-detail-item">
                <span className="crm-lead-detail-label"><User size={12}/> Admin Name</span>
                <span className="crm-lead-detail-value">{viewingOrg.admin?.name || "-"}</span>
              </div>
              <div className="crm-lead-detail-item">
                <span className="crm-lead-detail-label">Email Address</span>
                <span className="crm-lead-detail-value">{viewingOrg.admin?.email || "-"}</span>
              </div>
              <div className="crm-lead-detail-item">
                <span className="crm-lead-detail-label"><Phone size={12}/> Phone Number</span>
                <span className="crm-lead-detail-value">{viewingOrg.admin?.phone || "-"}</span>
              </div>
              <div className="crm-lead-detail-item">
                <span className="crm-lead-detail-label">Payment Status</span>
                <span className="crm-lead-detail-value">
                  <span className={`crm-status-badge ${viewingOrg.paymentStatus === "Paid" ? "badge-active" : "badge-pending"}`}>
                    {viewingOrg.paymentStatus || "Paid"}
                  </span>
                </span>
              </div>
            </div>
          </section>
        )}
      </DetailPopup>

      <Modal open={open} title="Add Organization" onClose={() => setOpen(false)}>
        <form className="form-stack" onSubmit={submit}>
          {actionError && <div className="inline-error" role="alert">{actionError}</div>}
          <label>
            Organization name
            <input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </label>

          <div className="form-grid">
            <label>
              Admin contact name
              <input
                required
                value={form.adminName}
                onChange={(e) => setForm({ ...form, adminName: e.target.value })}
              />
            </label>

            <label>
              Admin contact email
              <input
                required
                type="email"
                value={form.adminEmail}
                onChange={(e) => setForm({ ...form, adminEmail: e.target.value })}
              />
            </label>
          </div>

          <div className="form-grid">
            <label>
              Admin contact phone
              <input
                required
                value={form.adminPhone}
                onChange={(e) => setForm({ ...form, adminPhone: e.target.value })}
              />
            </label>

            <label>
              Temporary admin password (at least 8 characters if this email is not an existing CRM account)
              <input
                required={!matchingCreateAdmin}
                type="password"
                minLength={8}
                autoComplete="new-password"
                value={form.adminPassword}
                onChange={(e) => setForm({ ...form, adminPassword: e.target.value })}
              />
            </label>

            <label>
              Plan
              <select
                value={form.planId}
                onChange={(e) => setForm({ ...form, planId: e.target.value })}
              >
                {data.plans.map((plan) => (
                  <option value={plan.id} key={plan.id}>{plan.name}</option>
                ))}
              </select>
            </label>
          </div>

          <div className="form-note">
            The admin account is matched by the email you enter or created with the temporary password.
          </div>

          <div className="modal-actions">
            <button
              type="button"
              className="secondary-button"
              onClick={() => setOpen(false)}
            >
              Cancel
            </button>
            <button type="submit" className="primary-button" disabled={savingCreate}>
              {savingCreate ? "Saving…" : "Create Organization"}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        open={Boolean(editOrgId && editForm)}
        title="Edit Organization"
        onClose={() => {
          setEditOrgId(null);
          setEditForm(null);
        }}
        size="large"
      >
        {editForm && (
          <form className="form-stack" onSubmit={submitEdit}>
            <div className="form-grid">
              <label>
                Organization name
                <input
                  required
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                />
              </label>

              <label>
                Organization status
                <select
                  value={editForm.status}
                  onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
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
                  value={editForm.planId}
                  onChange={(e) => setEditForm({ ...editForm, planId: e.target.value })}
                >
                  {data.plans.map((plan) => (
                    <option key={plan.id} value={plan.id}>{plan.name}</option>
                  ))}
                </select>
              </label>

              <label>
                Subscription status
                <select
                  value={editForm.subscriptionStatus}
                  onChange={(e) => setEditForm({ ...editForm, subscriptionStatus: e.target.value })}
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
                value={editForm.paymentStatus}
                onChange={(e) => setEditForm({ ...editForm, paymentStatus: e.target.value })}
              >
                <option>Paid</option>
                <option>Payment Pending</option>
                <option>Unpaid</option>
                <option>Failed</option>
              </select>
            </label>

            <div className="form-grid">
              <label>
                Admin contact name
                <input
                  required={!editForm.currentAdminId}
                  value={editForm.adminName}
                  onChange={(e) => setEditForm({ ...editForm, adminName: e.target.value })}
                />
              </label>

              <label>
                Admin contact email
                <input
                  required={!editForm.currentAdminId}
                  type="email"
                  value={editForm.adminEmail}
                  onChange={(e) => setEditForm({ ...editForm, adminEmail: e.target.value })}
                />
              </label>
            </div>

            <label>
              Admin contact phone
              <input
                value={editForm.adminPhone}
                onChange={(e) => setEditForm({ ...editForm, adminPhone: e.target.value })}
              />
            </label>

            {!editForm.currentAdminId && (
              <label>
                Temporary admin password (at least 8 characters if this email is not an existing CRM account)
                <input
                  required={!existingUsers.some((user) => user.email?.trim().toLowerCase() === editForm.adminEmail.trim().toLowerCase())}
                  type="password"
                  minLength={8}
                  autoComplete="new-password"
                  value={editForm.adminPassword}
                  onChange={(e) => setEditForm({ ...editForm, adminPassword: e.target.value })}
                />
              </label>
            )}

            <div className="modal-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={() => {
                  setEditOrgId(null);
                  setEditForm(null);
                }}
              >
                Cancel
              </button>

              <button type="submit" className="primary-button" disabled={savingEdit}>
                {savingEdit ? "Saving…" : "Save Changes"}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </>
  );
}

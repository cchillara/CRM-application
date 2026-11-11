import { Building, Calendar, Check, CreditCard, DollarSign, Pencil, Phone, Sparkles, User, Users } from "lucide-react";
import { useState } from "react";
import Modal from "../components/Modal";
import DetailPopup from "../components/DetailPopup";
import Status from "../components/Status";
import { usePlatform } from "../context/PlatformContext";

const formatCurrency = (value) => new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0
}).format(value);

export default function Subscriptions() {
  const {
    data,
    metrics,
    apiLoading,
    updatePlan,
    updateOrganization
  } = usePlatform();

  const [selected, setSelected] = useState(null);
  const [viewingSubOrg, setViewingSubOrg] = useState(null);
  const [subPopupTab, setSubPopupTab] = useState("details");
  const [planPopupTab, setPlanPopupTab] = useState("details");
  const [editPlanId, setEditPlanId] = useState(null);
  const [form, setForm] = useState(null);

  const [editOrgId, setEditOrgId] = useState(null);
  const [orgForm, setOrgForm] = useState(null);
  const [saveError, setSaveError] = useState("");
  const [savingPlan, setSavingPlan] = useState(false);
  const [savingOrg, setSavingOrg] = useState(false);

  function openEdit(plan) {
    setEditPlanId(plan.id);
    setForm({
      name: plan.name,
      price: plan.price,
      billing: plan.billing,
      userLimit: plan.userLimit,
      features: plan.features.join("\n")
    });
    setSelected(null);
  }

  async function savePlan(event) {
    event.preventDefault();
    if (savingPlan) return;
    setSaveError("");
    setSavingPlan(true);
    try {
      await updatePlan(editPlanId, form);
      setEditPlanId(null);
      setForm(null);
    } catch (error) { setSaveError(error.message || "Could not save plan"); }
    finally { setSavingPlan(false); }
  }

  function openOrganizationEdit(org) {
    setEditOrgId(org.id);
    setOrgForm({
      name: org.name,
      status: org.status,
      planId: org.planId,
      subscriptionStatus: org.subscriptionStatus,
      paymentStatus: org.paymentStatus,
      adminName: org.admin?.name || "",
      adminEmail: org.admin?.email || "",
      adminPhone: org.admin?.phone || ""
    });
  }

  async function saveOrganizationSubscription(event) {
    event.preventDefault();
    if (savingOrg) return;
    setSaveError("");
    setSavingOrg(true);
    try {
      await updateOrganization(editOrgId, orgForm);
      setEditOrgId(null);
      setOrgForm(null);
    } catch (error) { setSaveError(error.message || "Could not save subscription"); }
    finally { setSavingOrg(false); }
  }

  const editingPlan = data.plans.find((plan) => plan.id === editPlanId);
  const editingOrganization = data.organizations.find((org) => org.id === editOrgId);

  return (
    <>
      <section className="subscription-summary four-summary">
        <div>
          <span>Active Subscriptions</span>
          <strong>{metrics.activeSubscriptions}</strong>
        </div>
        <div>
          <span>Payment Pending</span>
          <strong>{metrics.paymentPending}</strong>
        </div>
        <div>
          <span>Monthly Revenue</span>
          <strong>{formatCurrency(metrics.monthlyRevenue)}</strong>
        </div>
        <div>
          <span>Organizations</span>
          <strong>{metrics.totalOrganizations}</strong>
        </div>
      </section>

      <section className="plans-grid">
        {data.plans.map((plan) => {
          const organizations = data.organizations.filter((org) => org.planId === plan.id);
          const active = organizations.filter((org) => org.subscriptionStatus === "Active").length;

          return (
            <article
              className="plan-card editable-plan-card"
              key={plan.id}
              onClick={() => setSelected({ plan, organizations })}
              style={{ cursor: "pointer" }}
            >
              <span>{plan.name}</span>
              <strong>{formatCurrency(plan.price)}
                <small>/{plan.billing.toLowerCase()}</small>
              </strong>

              <p>Up to {plan.userLimit} users · {plan.billing}</p>
              <div>{active} active {active === 1 ? "subscription" : "subscriptions"}</div>

              <div className="plan-card-actions">
                <button
                  className="secondary-button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelected({ plan, organizations });
                  }}
                >
                  View Details
                </button>

                <button
                  className="primary-button"
                  onClick={(e) => {
                    e.stopPropagation();
                    openEdit(plan);
                  }}
                >
                  <Pencil size={14} />
                  Edit Plan
                </button>
              </div>
            </article>
          );
        })}
      </section>

      <section className="panel subscription-org-panel">
        <div className="panel-title">
          <div>
            <h3>Organization Subscription Status</h3>
            <p>Edit plan, subscription status, payment status or organization status directly here.</p>
          </div>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Organization</th>
                <th>Plan</th>
                <th>Subscription</th>
                <th>Payment</th>
                <th>Organization Status</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {data.organizations.map((org) => {
                const plan = data.plans.find((item) => item.id === org.planId);

                return (
                  <tr
                    key={org.id}
                    onClick={() => setViewingSubOrg(org)}
                    style={{ cursor: "pointer" }}
                  >
                    <td>
                      <strong>{org.name}</strong>
                    </td>
                    <td>{plan?.name || "-"}</td>
                    <td><Status value={org.subscriptionStatus} /></td>
                    <td><Status value={org.paymentStatus || "-"} /></td>
                    <td><Status value={org.status} /></td>
                    <td>
                      <button
                        className="table-action"
                        onClick={(e) => {
                          e.stopPropagation();
                          openOrganizationEdit(org);
                        }}
                      >
                        <Pencil size={14} />
                        Edit
                      </button>
                    </td>
                  </tr>
                );
              })}
              {data.organizations.length === 0 && (
                <tr><td colSpan="6" className="empty-cell">{apiLoading ? "Loading subscriptionsÃ¢â‚¬Â¦" : "No organization subscriptions found."}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Organization Subscription Details Popup Dialog (matching screenshot format) */}
      <DetailPopup
        isOpen={Boolean(viewingSubOrg)}
        onClose={() => setViewingSubOrg(null)}
        title={viewingSubOrg?.name}
        tier={(() => {
          const plan = data.plans.find((p) => p.id === viewingSubOrg?.planId);
          return plan ? plan.name.replace(/ plan$/i, "") : "Enterprise";
        })()}
        phone={viewingSubOrg?.admin?.phone || "+91 98111 22233"}
        tabs={[
          { id: "details", label: "Subscription Details", icon: CreditCard },
          { id: "features", label: "Plan Features", icon: Check },
          { id: "admin", label: "Billing Admin", icon: User },
        ]}
        activeTab={subPopupTab}
        onTabChange={setSubPopupTab}
        footerActions={
          <>
            <button
              type="button"
              className="primary-button"
              onClick={() => {
                const orgToEdit = viewingSubOrg;
                setViewingSubOrg(null);
                openOrganizationEdit(orgToEdit);
              }}
            >
              <Pencil size={14} /> Edit Subscription
            </button>
            <button
              type="button"
              className="secondary-button"
              onClick={() => setViewingSubOrg(null)}
            >
              Close
            </button>
          </>
        }
      >
        {viewingSubOrg && subPopupTab === "details" && (() => {
          const plan = data.plans.find((p) => p.id === viewingSubOrg.planId);
          return (
            <section className="crm-slideover-section" aria-label="Subscription details">
              <div className="crm-slideover-section-header">
                <div className="crm-slideover-section-title">
                  <CreditCard size={16} />
                  <span>Subscription details</span>
                </div>
              </div>

              <div className="crm-lead-details-grid">
                <div className="crm-lead-detail-item crm-lead-detail-full">
                  <span className="crm-lead-detail-label">SUBSCRIPTION DESCRIPTION</span>
                  <p className="crm-lead-detail-desc">
                    Active subscription for {viewingSubOrg.name} on the {plan?.name || "Enterprise"} tier billed {plan?.billing?.toLowerCase() || "monthly"} with {viewingSubOrg.users?.length || 0} enrolled users.
                  </p>
                </div>

                <div className="crm-lead-detail-item">
                  <span className="crm-lead-detail-label">ID</span>
                  <span className="crm-lead-detail-value">SUB-{viewingSubOrg.id.slice(0, 8)}</span>
                </div>

                <div className="crm-lead-detail-item">
                  <span className="crm-lead-detail-label">
                    <User size={12} /> CONTACT PERSON
                  </span>
                  <span className="crm-lead-detail-value">{viewingSubOrg.admin?.name || "Rahul Sharma"}</span>
                </div>

                <div className="crm-lead-detail-item">
                  <span className="crm-lead-detail-label">
                    <Phone size={12} /> CONTACT NUMBER
                  </span>
                  <span className="crm-lead-detail-value">{viewingSubOrg.admin?.phone || "+91 98111 22233"}</span>
                </div>

                <div className="crm-lead-detail-item">
                  <span className="crm-lead-detail-label">
                    <Calendar size={12} /> CREATED DATE
                  </span>
                  <span className="crm-lead-detail-value">{viewingSubOrg.joined || "10-01-2026"}</span>
                </div>

                <div className="crm-lead-detail-item">
                  <span className="crm-lead-detail-label">STATUS</span>
                  <span className="crm-lead-detail-value">
                    <span className={`crm-status-badge ${viewingSubOrg.subscriptionStatus === "Active" ? "badge-active" : "badge-pending"}`}>
                      {viewingSubOrg.subscriptionStatus || "Active"}
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
                    {viewingSubOrg.users?.length || 0} / {plan?.userLimit || 25} Users
                  </span>
                </div>
              </div>
            </section>
          );
        })()}

        {viewingSubOrg && subPopupTab === "features" && (() => {
          const plan = data.plans.find((p) => p.id === viewingSubOrg.planId);
          return (
            <section className="crm-slideover-section" aria-label="Plan features">
              <div className="crm-slideover-section-header">
                <div className="crm-slideover-section-title">
                  <Check size={16} />
                  <span>{plan?.name || "Enterprise"} Plan Features & Inclusions</span>
                </div>
              </div>
              {plan && plan.features?.length > 0 ? (
                <ul className="popup-feature-list">
                  {plan.features.map((feat, i) => (
                    <li key={i}>{feat}</li>
                  ))}
                </ul>
              ) : (
                <p style={{ margin: 0, color: "var(--text-muted)", fontSize: "13px" }}>No specific features listed for this plan.</p>
              )}
            </section>
          );
        })()}

        {viewingSubOrg && subPopupTab === "admin" && (
          <section className="crm-slideover-section" aria-label="Billing contact">
            <div className="crm-slideover-section-header">
              <div className="crm-slideover-section-title">
                <User size={16} />
                <span>Billing Admin Contact</span>
              </div>
            </div>
            <div className="crm-lead-details-grid">
              <div className="crm-lead-detail-item">
                <span className="crm-lead-detail-label"><User size={12}/> Admin Name</span>
                <span className="crm-lead-detail-value">{viewingSubOrg.admin?.name || "-"}</span>
              </div>
              <div className="crm-lead-detail-item">
                <span className="crm-lead-detail-label">Billing Email</span>
                <span className="crm-lead-detail-value">{viewingSubOrg.admin?.email || "-"}</span>
              </div>
              <div className="crm-lead-detail-item">
                <span className="crm-lead-detail-label"><Phone size={12}/> Contact Number</span>
                <span className="crm-lead-detail-value">{viewingSubOrg.admin?.phone || "-"}</span>
              </div>
              <div className="crm-lead-detail-item">
                <span className="crm-lead-detail-label">Payment Status</span>
                <span className="crm-lead-detail-value">
                  <span className={`crm-status-badge ${viewingSubOrg.paymentStatus === "Paid" ? "badge-active" : "badge-pending"}`}>
                    {viewingSubOrg.paymentStatus || "Paid"}
                  </span>
                </span>
              </div>
            </div>
          </section>
        )}
      </DetailPopup>

      {/* Plan Details Popup Dialog (matching screenshot format) */}
      <DetailPopup
        isOpen={Boolean(selected)}
        onClose={() => setSelected(null)}
        title={selected?.plan?.name ? `${selected.plan.name} Plan` : "Plan Details"}
        tier={selected?.plan?.name?.replace(/ plan$/i, "") || "Enterprise"}
        subtitle={`Billed ${selected?.plan?.billing || "Monthly"}`}
        tabs={[
          { id: "details", label: "Plan Details", icon: CreditCard },
          { id: "orgs", label: "Subscribed Organizations", icon: Building, badge: selected?.organizations?.length || 0 },
          { id: "features", label: "Included Features", icon: Check },
        ]}
        activeTab={planPopupTab}
        onTabChange={setPlanPopupTab}
        footerActions={
          <>
            <button
              type="button"
              className="primary-button"
              onClick={() => {
                const planToEdit = selected.plan;
                setSelected(null);
                openEdit(planToEdit);
              }}
            >
              <Pencil size={14} /> Edit Plan
            </button>
            <button
              type="button"
              className="secondary-button"
              onClick={() => setSelected(null)}
            >
              Close
            </button>
          </>
        }
      >
        {selected && planPopupTab === "details" && (
          <section className="crm-slideover-section" aria-label="Plan details">
            <div className="crm-slideover-section-header">
              <div className="crm-slideover-section-title">
                <CreditCard size={16} />
                <span>Plan details</span>
              </div>
            </div>

            <div className="crm-lead-details-grid">
              <div className="crm-lead-detail-item crm-lead-detail-full">
                <span className="crm-lead-detail-label">PLAN DESCRIPTION</span>
                <p className="crm-lead-detail-desc">
                  The {selected.plan.name} plan is billed {selected.plan.billing.toLowerCase()} at {formatCurrency(selected.plan.price)} per billing cycle and supports up to {selected.plan.userLimit} users per organization.
                </p>
              </div>

              <div className="crm-lead-detail-item">
                <span className="crm-lead-detail-label">ID</span>
                <span className="crm-lead-detail-value">{selected.plan.id}</span>
              </div>

              <div className="crm-lead-detail-item">
                <span className="crm-lead-detail-label">
                  <CreditCard size={12} /> TIER NAME
                </span>
                <span className="crm-lead-detail-value">{selected.plan.name}</span>
              </div>

              <div className="crm-lead-detail-item">
                <span className="crm-lead-detail-label">
                  <Calendar size={12} /> BILLING CYCLE
                </span>
                <span className="crm-lead-detail-value">{selected.plan.billing}</span>
              </div>

              <div className="crm-lead-detail-item">
                <span className="crm-lead-detail-label">
                  <Users size={12} /> USER LIMIT
                </span>
                <span className="crm-lead-detail-value">Up to {selected.plan.userLimit} users</span>
              </div>

              <div className="crm-lead-detail-item">
                <span className="crm-lead-detail-label">STATUS</span>
                <span className="crm-lead-detail-value">
                  <span className="crm-status-badge badge-active">Available</span>
                </span>
              </div>

              <div className="crm-lead-detail-item">
                <span className="crm-lead-detail-label">PRIORITY</span>
                <span className="crm-lead-detail-value">
                  <span className="crm-status-badge badge-pending">
                    {selected.plan.name.includes("Enterprise") ? "High" : selected.plan.name.includes("Pro") ? "Medium" : "Standard"}
                  </span>
                </span>
              </div>

              <div className="crm-lead-detail-item">
                <span className="crm-lead-detail-label">
                  <DollarSign size={12} /> EXPECTED VALUE
                </span>
                <span className="crm-lead-detail-value" style={{ color: "#059669", fontWeight: 700 }}>
                  {formatCurrency(selected.plan.price)}
                </span>
              </div>

              <div className="crm-lead-detail-item">
                <span className="crm-lead-detail-label">
                  <Building size={12} /> SUBSCRIBED ORGS
                </span>
                <span className="crm-lead-detail-value">
                  {selected.organizations.length} Organizations
                </span>
              </div>
            </div>
          </section>
        )}

        {selected && planPopupTab === "orgs" && (
          <section className="crm-slideover-section" aria-label="Subscribed organizations">
            <div className="crm-slideover-section-header">
              <div className="crm-slideover-section-title">
                <Building size={16} />
                <span>Subscribed Organizations ({selected.organizations.length})</span>
              </div>
            </div>
            {selected.organizations.length > 0 ? (
              <div className="crm-popup-table-wrap">
                <table className="crm-popup-table">
                  <thead>
                    <tr>
                      <th>Organization</th>
                      <th>Users</th>
                      <th>Subscription</th>
                      <th>Payment</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selected.organizations.map((org) => (
                      <tr key={org.id}>
                        <td><strong>{org.name}</strong></td>
                        <td>{org.users?.length || 0}</td>
                        <td><span className="crm-status-badge badge-active">{org.subscriptionStatus}</span></td>
                        <td><span className={`crm-status-badge ${org.paymentStatus === "Paid" ? "badge-active" : "badge-pending"}`}>{org.paymentStatus || "Paid"}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p style={{ margin: 0, color: "var(--text-muted)", fontSize: "13px" }}>No organizations currently subscribed to this plan.</p>
            )}
          </section>
        )}

        {selected && planPopupTab === "features" && (
          <section className="crm-slideover-section" aria-label="Plan features">
            <div className="crm-slideover-section-header">
              <div className="crm-slideover-section-title">
                <Check size={16} />
                <span>What this plan offers</span>
              </div>
            </div>
            <ul className="popup-feature-list">
              {selected.plan.features.map((feature, i) => (
                <li key={i}>{feature}</li>
              ))}
            </ul>
          </section>
        )}
      </DetailPopup>

      <Modal
        open={Boolean(editingPlan && form)}
        title={editingPlan ? `Edit ${editingPlan.name} Plan` : "Edit Plan"}
        onClose={() => {
          setEditPlanId(null);
          setForm(null);
        }}
        size="large"
      >
        {form && (
          <form className="form-stack" onSubmit={savePlan}>
            {saveError && <div className="inline-error" role="alert">{saveError}</div>}
            <div className="form-grid">
              <label>
                Plan name
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </label>

              <label>
                Price (Ã¢â€šÂ¹ / month)
                <input
                  required
                  min="0"
                  type="number"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                />
              </label>
            </div>

            <div className="form-grid">
              <label>
                Billing
                <select
                  value={form.billing}
                  onChange={(e) => setForm({ ...form, billing: e.target.value })}
                >
                  <option>Monthly</option>
                  <option>Quarterly</option>
                  <option>Yearly</option>
                </select>
              </label>

              <label>
                User limit
                <input
                  required
                  min="1"
                  type="number"
                  value={form.userLimit}
                  onChange={(e) => setForm({ ...form, userLimit: e.target.value })}
                />
              </label>
            </div>

            <label>
              Features
              <small className="label-help">One feature per line</small>
              <textarea
                rows="7"
                value={form.features}
                onChange={(e) => setForm({ ...form, features: e.target.value })}
              />
            </label>

            <div className="modal-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={() => {
                  setEditPlanId(null);
                  setForm(null);
                }}
              >
                Cancel
              </button>
              <button type="submit" className="primary-button" disabled={savingPlan}>
                {savingPlan ? "SavingÃ¢â‚¬Â¦" : "Save Plan"}
              </button>
            </div>
          </form>
        )}
      </Modal>

      <Modal
        open={Boolean(editingOrganization && orgForm)}
        title={editingOrganization ? `Edit Subscription Ã‚Â· ${editingOrganization.name}` : "Edit Subscription"}
        onClose={() => {
          setEditOrgId(null);
          setOrgForm(null);
        }}
      >
        {orgForm && (
          <form className="form-stack" onSubmit={saveOrganizationSubscription}>
            {saveError && <div className="inline-error" role="alert">{saveError}</div>}
            <label>
              Plan
              <select
                value={orgForm.planId}
                onChange={(e) => setOrgForm({ ...orgForm, planId: e.target.value })}
              >
                {data.plans.map((plan) => (
                  <option key={plan.id} value={plan.id}>{plan.name}</option>
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

            <div className="modal-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={() => {
                  setEditOrgId(null);
                  setOrgForm(null);
                }}
              >
                Cancel
              </button>
              <button type="submit" className="primary-button" disabled={savingOrg}>
                {savingOrg ? "SavingÃ¢â‚¬Â¦" : "Save Changes"}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </>
  );
}

import { Pencil } from "lucide-react";
import { useState } from "react";
import Modal from "../components/Modal";
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
            <article className="plan-card editable-plan-card" key={plan.id}>
              <span>{plan.name}</span>
              <strong>{formatCurrency(plan.price)}
                <small>/{plan.billing.toLowerCase()}</small>
              </strong>

              <p>Up to {plan.userLimit} users · {plan.billing}</p>
              <div>{active} active {active === 1 ? "subscription" : "subscriptions"}</div>

              <div className="plan-card-actions">
                <button
                  className="secondary-button"
                  onClick={() => setSelected({ plan, organizations })}
                >
                  View Details
                </button>

                <button
                  className="primary-button"
                  onClick={() => openEdit(plan)}
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
                  <tr key={org.id}>
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
                        onClick={() => openOrganizationEdit(org)}
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

      <Modal
        open={Boolean(selected)}
        title={selected ? `${selected.plan.name} Plan` : "Plan Details"}
        onClose={() => setSelected(null)}
        size="large"
      >
        {selected && (
          <div className="plan-details">
            <div className="detail-cards compact">
              <div className="detail-card plan-detail-price">
                <span>Price</span>
                <strong>{formatCurrency(selected.plan.price)}</strong>
                <small>per {selected.plan.billing.toLowerCase()}</small>
              </div>

              <div className="detail-card plan-detail-users">
                <span>User Limit</span>
                <strong>{selected.plan.userLimit}</strong>
                <small>users per organization</small>
              </div>

              <div className="detail-card plan-detail-organizations">
                <span>Organizations</span>
                <strong>{selected.organizations.length}</strong>
                <small>using this plan</small>
              </div>
            </div>

            <div className="plan-description">
              <span className="plan-description-label">PLAN SUMMARY</span>
              <p>
                The {selected.plan.name} plan is billed {selected.plan.billing.toLowerCase()} at {formatCurrency(selected.plan.price)} per billing cycle and supports up to {selected.plan.userLimit} users per organization. It includes {selected.plan.features.length} listed {selected.plan.features.length === 1 ? "feature" : "features"} and is currently used by {selected.organizations.length} {selected.organizations.length === 1 ? "organization" : "organizations"}.
              </p>
            </div>

            <h3>What this plan offers</h3>

            <ul className="feature-list">
              {selected.plan.features.map((feature) => (
                <li key={feature}>{feature}</li>
              ))}
            </ul>

            <div className="modal-actions">
              <button
                className="primary-button"
                onClick={() => openEdit(selected.plan)}
              >
                <Pencil size={14} />
                Edit Plan
              </button>
            </div>

            {selected.organizations.length > 0 && (
              <>
                <h3>Organizations on this plan</h3>
                <div className="simple-list">
                  {selected.organizations.map((org) => (
                    <div key={org.id}>
                      <strong>{org.name}</strong>
                      <span>
                        {org.users.length} {org.users.length === 1 ? "user" : "users"} &middot; {org.subscriptionStatus} &middot; {org.paymentStatus}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </Modal>

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

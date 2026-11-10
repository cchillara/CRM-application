import { Building2, CreditCard, Headphones, Users } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { usePlatform } from "../context/PlatformContext";
import Status from "../components/Status";
import Modal from "../components/Modal";

function formatCurrency(value) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value);
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { data, metrics } = usePlatform();
  const [viewingOrg, setViewingOrg] = useState(null);
  const [viewingPlan, setViewingPlan] = useState(null);

  const cards = [
    { label: "Organizations", value: metrics.totalOrganizations, helper: `${metrics.activeOrganizations} active`, icon: Building2, path: "/organizations" },
    { label: "Users", value: metrics.totalUsers, helper: `${metrics.activeUsers} active`, icon: Users, path: "/organizations" },
    { label: "Subscriptions", value: metrics.activeSubscriptions, helper: `${formatCurrency(metrics.monthlyRevenue)} / month`, icon: CreditCard, path: "/subscriptions" },
    { label: "Open Queries", value: metrics.openTickets, helper: "Support requests", icon: Headphones, path: "/support" }
  ];

  return (
    <>
      <section className="stats-grid platform-overview-stats">
        {cards.map(({ label, value, helper, icon: Icon, path }) => (
          <button className="stat-card" key={label} onClick={() => navigate(path)}>
            <div className="stat-card-top">
              <span>{label}</span>
              <Icon size={19} />
            </div>
            <strong>{value}</strong>
            <small>{helper}</small>
          </button>
        ))}
      </section>

      <section className="dashboard-columns">
        <div className="panel">
          <div className="panel-title">
            <div><h3>Organizations</h3><p>Recently added organizations</p></div>
            <button className="text-button" onClick={() => navigate("/organizations")}>View all</button>
          </div>
          <div className="list">
            {data.organizations.slice(0, 5).map((org) => (
              <button
                className="list-row"
                key={org.id}
                onClick={() => setViewingOrg(org)}
                title="Click to view organization details"
              >
                <div className="list-main">
                  <div className="org-mark">{org.name.slice(0, 2).toUpperCase()}</div>
                  <div>
                    <strong>{org.name}</strong>
                    <span>{org.users.length} users · {data.plans.find((plan) => plan.id === org.planId)?.name || "No plan"}</span>
                  </div>
                </div>
                <Status value={org.status} />
              </button>
            ))}
          </div>
        </div>

        <div className="panel">
          <div className="panel-title">
            <div><h3>Subscription Summary</h3><p>Calculated from organization plans</p></div>
            <button className="text-button" onClick={() => navigate("/subscriptions")}>View plans</button>
          </div>
          <div className="plan-summary-list">
            {data.plans.map((plan) => {
              const orgsOnPlan = data.organizations.filter((org) => org.planId === plan.id);
              const count = orgsOnPlan.filter((org) => org.subscriptionStatus === "Active").length;
              return (
                <div
                  className="plan-summary-row"
                  key={plan.id}
                  onClick={() => setViewingPlan({ plan, count, organizations: orgsOnPlan })}
                  style={{ cursor: "pointer" }}
                  title="Click to view subscription details"
                >
                  <div><strong>{plan.name}</strong><span>{formatCurrency(plan.price)} / {plan.billing.toLowerCase()}</span></div>
                  <b>{count}</b>
                </div>
              );
            })}
            <div className="revenue-row"><span>Monthly revenue</span><strong>{formatCurrency(metrics.monthlyRevenue)}</strong></div>
          </div>
        </div>
      </section>

      <section className="dashboard-bottom-grid">
        <div className="panel">
          <div className="panel-title"><div><h3>Support</h3><p>Latest organization queries</p></div></div>
          <div className="list">
            {data.tickets.slice(0, 4).map((ticket) => {
              const org = data.organizations.find((item) => item.id === ticket.orgId);
              return (
                <button className="list-row support-row" key={ticket.id} onClick={() => navigate("/support")}>
                  <div><strong>{ticket.subject}</strong><span>{org?.name || ticket.orgId}</span></div>
                  <Status value={ticket.status} />
                </button>
              );
            })}
          </div>
        </div>

        <div className="panel">
          <div className="panel-title"><div><h3>Recent Activity</h3><p>Latest admin actions</p></div></div>
          <div className="activity-list">
            {data.auditLogs.slice(0, 5).map((log) => (
              <div className="activity-item" key={log.id}>
                <div className="activity-dot" />
                <div><strong>{log.action}</strong><span>{log.detail}</span></div>
                <small>{log.createdAt}</small>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Organization Details Popup Modal */}
      <Modal
        open={Boolean(viewingOrg)}
        title={viewingOrg ? `${viewingOrg.name} — Organization Details` : "Organization Details"}
        onClose={() => setViewingOrg(null)}
        size="large"
      >
        {viewingOrg && (
          <div className="org-popup-content">
            <div className="popup-header-banner">
              <div className="popup-org-mark">
                {viewingOrg.name.slice(0, 2).toUpperCase()}
              </div>
              <div className="popup-header-info">
                <h3>{viewingOrg.name}</h3>
                <p>Organization ID: {viewingOrg.id} &middot; Joined {viewingOrg.joined || "N/A"}</p>
              </div>
              <div className="popup-header-statuses">
                <Status value={viewingOrg.status} />
                <Status value={viewingOrg.subscriptionStatus} />
                <Status value={viewingOrg.paymentStatus} />
              </div>
            </div>

            <div className="popup-grid four-cards">
              <div className="popup-card">
                <span>Plan</span>
                <strong>{data.plans.find((p) => p.id === viewingOrg.planId)?.name || "No plan"}</strong>
                <small>{(() => {
                  const p = data.plans.find((item) => item.id === viewingOrg.planId);
                  return p ? `₹${p.price.toLocaleString("en-IN")} / ${p.billing.toLowerCase()}` : "Free tier";
                })()}</small>
              </div>

              <div className="popup-card">
                <span>Users</span>
                <strong>{viewingOrg.users?.length || 0}</strong>
                <small>{(() => {
                  const p = data.plans.find((item) => item.id === viewingOrg.planId);
                  return p ? `Max ${p.userLimit} user limit` : "Active members";
                })()}</small>
              </div>

              <div className="popup-card">
                <span>Subscription</span>
                <strong>{viewingOrg.subscriptionStatus || "Active"}</strong>
                <small>Current status</small>
              </div>

              <div className="popup-card">
                <span>Payment</span>
                <strong>{viewingOrg.paymentStatus || "Paid"}</strong>
                <small>Payment status</small>
              </div>
            </div>

            <div className="popup-section">
              <h4>Organization Admin</h4>
              <div className="popup-admin-grid">
                <div>
                  <span>Admin Name</span>
                  <strong>{viewingOrg.admin?.name || "-"}</strong>
                </div>
                <div>
                  <span>Email Address</span>
                  <strong>{viewingOrg.admin?.email || "-"}</strong>
                </div>
                <div>
                  <span>Phone Number</span>
                  <strong>{viewingOrg.admin?.phone || "-"}</strong>
                </div>
              </div>
            </div>

            <div className="modal-actions">
              <button
                type="button"
                className="primary-button"
                onClick={() => {
                  const id = viewingOrg.id;
                  setViewingOrg(null);
                  navigate(`/organizations/${id}`);
                }}
              >
                View Full Page
              </button>
              <button
                type="button"
                className="secondary-button"
                onClick={() => setViewingOrg(null)}
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Plan / Subscription Details Popup Modal */}
      <Modal
        open={Boolean(viewingPlan)}
        title={viewingPlan ? `${viewingPlan.plan.name} — Subscription Plan Details` : "Subscription Details"}
        onClose={() => setViewingPlan(null)}
        size="large"
      >
        {viewingPlan && (
          <div className="sub-popup-content">
            <div className="popup-header-banner">
              <div className="popup-org-mark">
                {viewingPlan.plan.name.slice(0, 2).toUpperCase()}
              </div>
              <div className="popup-header-info">
                <h3>{viewingPlan.plan.name}</h3>
                <p>Billed {viewingPlan.plan.billing.toLowerCase()} at {formatCurrency(viewingPlan.plan.price)}</p>
              </div>
              <div className="popup-header-statuses">
                <span className="role-badge">{viewingPlan.count} Active</span>
              </div>
            </div>

            <div className="popup-grid four-cards">
              <div className="popup-card">
                <span>Price</span>
                <strong>{formatCurrency(viewingPlan.plan.price)}</strong>
                <small>per {viewingPlan.plan.billing.toLowerCase()}</small>
              </div>

              <div className="popup-card">
                <span>User Limit</span>
                <strong>{viewingPlan.plan.userLimit}</strong>
                <small>users per organization</small>
              </div>

              <div className="popup-card">
                <span>Active Subs</span>
                <strong>{viewingPlan.count}</strong>
                <small>organizations active</small>
              </div>

              <div className="popup-card">
                <span>Total Orgs</span>
                <strong>{viewingPlan.organizations?.length || 0}</strong>
                <small>on this plan tier</small>
              </div>
            </div>

            <div className="popup-section">
              <h4>Included Features</h4>
              {viewingPlan.plan.features?.length > 0 ? (
                <ul className="popup-feature-list">
                  {viewingPlan.plan.features.map((feat, i) => (
                    <li key={i}>{feat}</li>
                  ))}
                </ul>
              ) : (
                <div className="popup-empty-note">No features specified for this plan.</div>
              )}
            </div>

            <div className="popup-section">
              <div className="popup-section-header">
                <h4>Organizations on this Plan ({viewingPlan.organizations?.length || 0})</h4>
              </div>
              {viewingPlan.organizations && viewingPlan.organizations.length > 0 ? (
                <div className="popup-table-wrap">
                  <table className="popup-table">
                    <thead>
                      <tr>
                        <th>Organization</th>
                        <th>Users</th>
                        <th>Subscription</th>
                        <th>Payment</th>
                      </tr>
                    </thead>
                    <tbody>
                      {viewingPlan.organizations.map((org) => (
                        <tr
                          key={org.id}
                          style={{ cursor: "pointer" }}
                          onClick={() => {
                            setViewingPlan(null);
                            setViewingOrg(org);
                          }}
                          title="Click to view organization details"
                        >
                          <td><strong>{org.name}</strong></td>
                          <td>{org.users?.length || 0}</td>
                          <td><Status value={org.subscriptionStatus} /></td>
                          <td><Status value={org.paymentStatus || "Paid"} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="popup-empty-note">No organizations are subscribed to this plan yet.</div>
              )}
            </div>

            <div className="modal-actions">
              <button
                type="button"
                className="primary-button"
                onClick={() => {
                  setViewingPlan(null);
                  navigate("/subscriptions");
                }}
              >
                Go to Subscriptions Page
              </button>
              <button
                type="button"
                className="secondary-button"
                onClick={() => setViewingPlan(null)}
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}

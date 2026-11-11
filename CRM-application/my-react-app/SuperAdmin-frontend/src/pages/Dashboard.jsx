import { Building, Building2, Calendar, Check, CreditCard, DollarSign, Headphones, Phone, User, Users } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { usePlatform } from "../context/PlatformContext";
import Status from "../components/Status";
import DetailPopup from "../components/DetailPopup";

function formatCurrency(value) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value);
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { data, metrics } = usePlatform();
  const [viewingOrg, setViewingOrg] = useState(null);
  const [orgPopupTab, setOrgPopupTab] = useState("details");
  const [viewingPlan, setViewingPlan] = useState(null);
  const [planPopupTab, setPlanPopupTab] = useState("details");

  const cards = [
    { label: "Organizations", value: metrics.totalOrganizations, helper: `${metrics.activeOrganizations} active`, icon: Building2, path: "/super-admin/organizations" },
    { label: "Users", value: metrics.totalUsers, helper: `${metrics.activeUsers} active`, icon: Users, path: "/super-admin/organizations" },
    { label: "Subscriptions", value: metrics.activeSubscriptions, helper: `${formatCurrency(metrics.monthlyRevenue)} / month`, icon: CreditCard, path: "/super-admin/subscriptions" },
    { label: "Open Queries", value: metrics.openTickets, helper: "Support requests", icon: Headphones, path: "/super-admin/support" }
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
            <button className="text-button" onClick={() => navigate("/super-admin/organizations")}>View all</button>
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
            <button className="text-button" onClick={() => navigate("/super-admin/subscriptions")}>View plans</button>
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
                <button className="list-row support-row" key={ticket.id} onClick={() => navigate("/super-admin/support")}>
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

      {/* Organization Details Popup — DetailPopup matching screenshot format */}
      <DetailPopup
        isOpen={Boolean(viewingOrg)}
        onClose={() => { setViewingOrg(null); setOrgPopupTab("details"); }}
        title={viewingOrg?.name}
        tier={(() => {
          const plan = data.plans.find((p) => p.id === viewingOrg?.planId);
          return plan?.name || "Enterprise";
        })()}
        phone={viewingOrg?.admin?.phone}
        tabs={[
          { id: "details", label: "Organization Details", icon: Building },
          { id: "users", label: "Team Members", icon: Users, badge: viewingOrg?.users?.length || 0 },
          { id: "admin", label: "Admin Contact", icon: User },
        ]}
        activeTab={orgPopupTab}
        onTabChange={setOrgPopupTab}
        footerActions={
          <>
            <button
              type="button"
              className="primary-button"
              onClick={() => {
                const id = viewingOrg.id;
                setViewingOrg(null);
                navigate(`/super-admin/organizations/${id}`);
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
          </>
        }
      >
        {viewingOrg && orgPopupTab === "details" && (() => {
          const plan = data.plans.find((p) => p.id === viewingOrg.planId);
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
                  <span className="crm-lead-detail-value">{viewingOrg.admin?.name || "-"}</span>
                </div>

                <div className="crm-lead-detail-item">
                  <span className="crm-lead-detail-label">
                    <Phone size={12} /> CONTACT NUMBER
                  </span>
                  <span className="crm-lead-detail-value">{viewingOrg.admin?.phone || "-"}</span>
                </div>

                <div className="crm-lead-detail-item">
                  <span className="crm-lead-detail-label">
                    <Calendar size={12} /> CREATED DATE
                  </span>
                  <span className="crm-lead-detail-value">{viewingOrg.joined || "N/A"}</span>
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
                  <span className="crm-lead-detail-label">PAYMENT STATUS</span>
                  <span className="crm-lead-detail-value">
                    <span className={`crm-status-badge ${viewingOrg.paymentStatus === "Paid" ? "badge-active" : "badge-pending"}`}>
                      {viewingOrg.paymentStatus || "Paid"}
                    </span>
                  </span>
                </div>

                <div className="crm-lead-detail-item">
                  <span className="crm-lead-detail-label">
                    <DollarSign size={12} /> PLAN PRICE
                  </span>
                  <span className="crm-lead-detail-value" style={{ color: "#059669", fontWeight: 700 }}>
                    {plan ? formatCurrency(plan.price) : "—"}
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

        {viewingOrg && orgPopupTab === "users" && (
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

        {viewingOrg && orgPopupTab === "admin" && (
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

      {/* Plan / Subscription Details Popup — DetailPopup matching screenshot format */}
      <DetailPopup
        isOpen={Boolean(viewingPlan)}
        onClose={() => { setViewingPlan(null); setPlanPopupTab("details"); }}
        title={viewingPlan?.plan?.name ? `${viewingPlan.plan.name} Plan` : "Subscription Details"}
        tier={viewingPlan?.plan?.name?.replace(/ plan$/i, "") || "Enterprise"}
        subtitle={`Billed ${viewingPlan?.plan?.billing || "Monthly"}`}
        tabs={[
          { id: "details", label: "Plan Details", icon: CreditCard },
          { id: "orgs", label: "Subscribed Organizations", icon: Building, badge: viewingPlan?.organizations?.length || 0 },
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
                setViewingPlan(null);
                navigate("/super-admin/subscriptions");
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
          </>
        }
      >
        {viewingPlan && planPopupTab === "details" && (
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
                  The {viewingPlan.plan.name} plan is billed {viewingPlan.plan.billing.toLowerCase()} at {formatCurrency(viewingPlan.plan.price)} per billing cycle and supports up to {viewingPlan.plan.userLimit} users per organization.
                </p>
              </div>

              <div className="crm-lead-detail-item">
                <span className="crm-lead-detail-label">ID</span>
                <span className="crm-lead-detail-value">{viewingPlan.plan.id}</span>
              </div>

              <div className="crm-lead-detail-item">
                <span className="crm-lead-detail-label">
                  <CreditCard size={12} /> TIER NAME
                </span>
                <span className="crm-lead-detail-value">{viewingPlan.plan.name}</span>
              </div>

              <div className="crm-lead-detail-item">
                <span className="crm-lead-detail-label">
                  <Calendar size={12} /> BILLING CYCLE
                </span>
                <span className="crm-lead-detail-value">{viewingPlan.plan.billing}</span>
              </div>

              <div className="crm-lead-detail-item">
                <span className="crm-lead-detail-label">
                  <Users size={12} /> USER LIMIT
                </span>
                <span className="crm-lead-detail-value">Up to {viewingPlan.plan.userLimit} users</span>
              </div>

              <div className="crm-lead-detail-item">
                <span className="crm-lead-detail-label">STATUS</span>
                <span className="crm-lead-detail-value">
                  <span className="crm-status-badge badge-active">Available</span>
                </span>
              </div>

              <div className="crm-lead-detail-item">
                <span className="crm-lead-detail-label">ACTIVE SUBSCRIPTIONS</span>
                <span className="crm-lead-detail-value">
                  <span className="crm-status-badge badge-progress">{viewingPlan.count} Active</span>
                </span>
              </div>

              <div className="crm-lead-detail-item">
                <span className="crm-lead-detail-label">
                  <DollarSign size={12} /> PLAN PRICE
                </span>
                <span className="crm-lead-detail-value" style={{ color: "#059669", fontWeight: 700 }}>
                  {formatCurrency(viewingPlan.plan.price)}
                </span>
              </div>

              <div className="crm-lead-detail-item">
                <span className="crm-lead-detail-label">
                  <Building size={12} /> TOTAL ORGS
                </span>
                <span className="crm-lead-detail-value">
                  {viewingPlan.organizations?.length || 0} organizations
                </span>
              </div>
            </div>
          </section>
        )}

        {viewingPlan && planPopupTab === "orgs" && (
          <section className="crm-slideover-section" aria-label="Subscribed organizations">
            <div className="crm-slideover-section-header">
              <div className="crm-slideover-section-title">
                <Building size={16} />
                <span>Organizations on this Plan ({viewingPlan.organizations?.length || 0})</span>
              </div>
            </div>
            {viewingPlan.organizations && viewingPlan.organizations.length > 0 ? (
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
                    {viewingPlan.organizations.map((org) => (
                      <tr
                        key={org.id}
                        style={{ cursor: "pointer" }}
                        onClick={() => {
                          setViewingPlan(null);
                          setViewingOrg(org);
                          setOrgPopupTab("details");
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
              <p style={{ margin: 0, color: "var(--text-muted)", fontSize: "13px" }}>No organizations are subscribed to this plan yet.</p>
            )}
          </section>
        )}

        {viewingPlan && planPopupTab === "features" && (
          <section className="crm-slideover-section" aria-label="Plan features">
            <div className="crm-slideover-section-header">
              <div className="crm-slideover-section-title">
                <Check size={16} />
                <span>{viewingPlan.plan.name} Plan Features &amp; Inclusions</span>
              </div>
            </div>
            {viewingPlan.plan.features?.length > 0 ? (
              <ul className="popup-feature-list">
                {viewingPlan.plan.features.map((feat, i) => (
                  <li key={i}>{feat}</li>
                ))}
              </ul>
            ) : (
              <p style={{ margin: 0, color: "var(--text-muted)", fontSize: "13px" }}>No features specified for this plan.</p>
            )}
          </section>
        )}
      </DetailPopup>
    </>
  );
}

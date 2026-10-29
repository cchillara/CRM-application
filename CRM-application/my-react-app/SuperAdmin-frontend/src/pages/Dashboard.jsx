import { Building2, CreditCard, Headphones, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { usePlatform } from "../context/PlatformContext";
import Status from "../components/Status";

function formatCurrency(value) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value);
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { data, metrics } = usePlatform();

  const cards = [
    { label: "Organizations", value: metrics.totalOrganizations, helper: `${metrics.activeOrganizations} active`, icon: Building2, path: "/organizations" },
    { label: "Users", value: metrics.totalUsers, helper: `${metrics.activeUsers} active`, icon: Users, path: "/organizations" },
    { label: "Subscriptions", value: metrics.activeSubscriptions, helper: `${formatCurrency(metrics.monthlyRevenue)} / month`, icon: CreditCard, path: "/subscriptions" },
    { label: "Open Queries", value: metrics.openTickets, helper: "Support requests", icon: Headphones, path: "/support" }
  ];

  return (
    <>
      <section className="overview-top">
        <div>
          <h2>Platform Overview</h2>
          <p>All numbers below are calculated from the current platform data.</p>
        </div>
      </section>

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
              <button className="list-row" key={org.id} onClick={() => navigate(`/organizations/${org.id}`)}>
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
              const count = data.organizations.filter((org) => org.planId === plan.id && org.subscriptionStatus === "Active").length;
              return (
                <div className="plan-summary-row" key={plan.id}>
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
    </>
  );
}

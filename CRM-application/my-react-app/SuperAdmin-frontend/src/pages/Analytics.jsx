import { usePlatform } from "../context/PlatformContext";

export default function Analytics() {
  const { data, metrics } = usePlatform();
  const maxUsers = Math.max(1, ...data.organizations.map((org) => org.users.length));

  return (
    <>
      <section className="stats-grid analytics-stats">
        <div className="stat-card static"><span>Organizations</span><strong>{metrics.totalOrganizations}</strong><small>{metrics.activeOrganizations} active</small></div>
        <div className="stat-card static"><span>Total Users</span><strong>{metrics.totalUsers}</strong><small>{metrics.activeUsers} active</small></div>
        <div className="stat-card static"><span>Active Subscriptions</span><strong>{metrics.activeSubscriptions}</strong><small>Current paid subscriptions</small></div>
        <div className="stat-card static"><span>Monthly Revenue</span><strong>₹{metrics.monthlyRevenue.toLocaleString("en-IN")}</strong><small>Calculated from active plans</small></div>
      </section>

      <section className="analytics-grid">
        <div className="panel">
          <div className="panel-title"><div><h3>Users by Organization</h3><p>Based on current organization user data</p></div></div>
          <div className="bar-list">{data.organizations.map((org) => <div className="bar-row" key={org.id}><div><span>{org.name}</span><strong>{org.users.length}</strong></div><div className="bar-track"><span style={{ width: `${(org.users.length / maxUsers) * 100}%` }} /></div></div>)}</div>
        </div>

        <div className="panel">
          <div className="panel-title"><div><h3>Plan Distribution</h3><p>Active subscriptions by plan</p></div></div>
          <div className="simple-list">{data.plans.map((plan) => { const count = data.organizations.filter((org) => org.planId === plan.id && org.subscriptionStatus === "Active").length; return <div key={plan.id}><strong>{plan.name}</strong><span>{count} organizations</span></div>; })}</div>
        </div>
      </section>
    </>
  );
}

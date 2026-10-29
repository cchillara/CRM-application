import { useMemo, useState } from "react";
import { Building2, CreditCard, Users, Wallet } from "lucide-react";
import { usePlatform } from "../context/PlatformContext";

const chartColors = ["#2563eb", "#0f9b8e", "#7866c6", "#e29a3b", "#4f83c2", "#54a779"];
const formatCurrency = (value) => new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0
}).format(value);

export default function Analytics() {
  const { data, metrics } = usePlatform();
  const [selectedOrganizationId, setSelectedOrganizationId] = useState(null);
  const [selectedPlanId, setSelectedPlanId] = useState(null);
  const [hoveredPlanId, setHoveredPlanId] = useState(null);
  const [hoveredLineOrganizationId, setHoveredLineOrganizationId] = useState(null);
  const [showAllOrganizations, setShowAllOrganizations] = useState(false);

  const organizations = useMemo(() => (data.organizations || [])
    .map((org) => ({ ...org, userCount: Array.isArray(org.users) ? org.users.length : 0 }))
    .sort((a, b) => b.userCount - a.userCount), [data.organizations]);
  const activePlans = useMemo(() => (data.plans || []).map((plan, index) => ({
    ...plan,
    color: chartColors[index % chartColors.length],
    count: (data.organizations || []).filter((org) => org.planId === plan.id && org.subscriptionStatus === "Active").length
  })), [data.plans, data.organizations]);
  const totalPlanSubscriptions = activePlans.reduce((sum, plan) => sum + plan.count, 0);
  const selectedOrganization = organizations.find((org) => org.id === selectedOrganizationId);
  const highlightedLineOrganization = organizations.find((org) => org.id === hoveredLineOrganizationId) || selectedOrganization;
  const selectedPlan = activePlans.find((plan) => plan.id === selectedPlanId);
  const highlightedPlan = activePlans.find((plan) => plan.id === hoveredPlanId) || selectedPlan;
  const visibleOrganizations = showAllOrganizations ? organizations : organizations.slice(0, 6);
  const maxUsers = Math.max(1, ...organizations.map((org) => org.userCount));
  const lineOrganizations = organizations.slice(0, 8);
  const linePlotMax = Math.max(4, Math.ceil(maxUsers / 4) * 4);
  const linePlotTop = 24;
  const linePlotBottom = 220;
  const linePoints = lineOrganizations.map((org, index) => ({
    ...org,
    x: lineOrganizations.length === 1 ? 380 : 68 + index * (664 / (lineOrganizations.length - 1)),
    y: linePlotBottom - (org.userCount / linePlotMax) * (linePlotBottom - linePlotTop)
  }));
  const linePath = linePoints.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ");
  const areaPath = linePoints.length ? `${linePath} L ${linePoints[linePoints.length - 1].x} ${linePlotBottom} L ${linePoints[0].x} ${linePlotBottom} Z` : "";
  let ringOffset = 0;

  return (
    <div className="analytics-page">
      <section className="stats-grid analytics-stats">
        <div className="stat-card static analytics-stat-card"><div className="analytics-stat-icon blue"><Building2 size={18} /></div><span>Organizations</span><strong>{metrics.totalOrganizations}</strong><small>{metrics.activeOrganizations} active</small></div>
        <div className="stat-card static analytics-stat-card"><div className="analytics-stat-icon teal"><Users size={18} /></div><span>Total Users</span><strong>{metrics.totalUsers}</strong><small>{metrics.activeUsers} active</small></div>
        <div className="stat-card static analytics-stat-card"><div className="analytics-stat-icon violet"><CreditCard size={18} /></div><span>Active Subscriptions</span><strong>{metrics.activeSubscriptions}</strong><small>Current paid subscriptions</small></div>
        <div className="stat-card static analytics-stat-card"><div className="analytics-stat-icon amber"><Wallet size={18} /></div><span>Monthly Revenue</span><strong>{formatCurrency(metrics.monthlyRevenue)}</strong><small>From active paid plans</small></div>
      </section>

      <section className="analytics-charts">
        <article className="panel analytics-chart-panel">
          <div className="analytics-chart-heading">
            <div><span className="analytics-eyebrow">ORGANIZATION INSIGHTS</span><h2>Users by organization</h2><p>Compare the number of users across your organizations.</p></div>
            <span className="analytics-chart-total"><Users size={15} /> {metrics.totalUsers} users</span>
          </div>
          {organizations.length ? <>
            <div className="organization-chart" role="group" aria-label="Users by organization">
              {visibleOrganizations.map((org, index) => (
                <button
                  className={`organization-chart-row ${selectedOrganizationId === org.id ? "selected" : ""}`}
                  key={org.id}
                  onClick={() => setSelectedOrganizationId(selectedOrganizationId === org.id ? null : org.id)}
                  aria-pressed={selectedOrganizationId === org.id}
                  title={`${org.name}: ${org.userCount} users`}
                >
                  <span className="organization-chart-name">{org.name}</span>
                  <span className="organization-chart-track"><span style={{ width: `${Math.max(org.userCount > 0 ? 5 : 0, (org.userCount / maxUsers) * 100)}%`, background: chartColors[index % chartColors.length] }} /></span>
                  <strong>{org.userCount}</strong>
                </button>
              ))}
            </div>
            <div className="analytics-chart-footer">
              <span>{selectedOrganization ? `${selectedOrganization.name} has ${selectedOrganization.userCount} users.` : "Select a row to view its user count."}</span>
              {organizations.length > 6 && <button className="text-button" onClick={() => setShowAllOrganizations(!showAllOrganizations)}>{showAllOrganizations ? "Show top 6" : "View all organizations"}</button>}
            </div>
          </> : <div className="analytics-empty"><Building2 size={22} /><strong>No organization data yet</strong><span>Organization user comparisons will appear here when data is available.</span></div>}
        </article>

        <article className="panel analytics-chart-panel plan-chart-panel">
          <div className="analytics-chart-heading">
            <div><span className="analytics-eyebrow">SUBSCRIPTION INSIGHTS</span><h2>Plan distribution</h2><p>Active organizations grouped by subscription plan.</p></div>
            <span className="analytics-chart-total"><CreditCard size={15} /> {totalPlanSubscriptions} active</span>
          </div>
          {activePlans.length && totalPlanSubscriptions > 0 ? <div className="plan-chart-content">
            <div className="plan-donut-wrap">
              <svg className="plan-donut" viewBox="0 0 160 160" role="img" aria-label={`Distribution of ${totalPlanSubscriptions} active subscriptions by plan`}>
                <circle className="plan-donut-track" cx="80" cy="80" r="58" />
                {activePlans.filter((plan) => plan.count > 0).map((plan) => {
                  const percentage = (plan.count / totalPlanSubscriptions) * 100;
                  const offset = ringOffset;
                  ringOffset += percentage;
                  return <circle
                    className={`plan-donut-segment ${highlightedPlan?.id === plan.id ? "selected" : ""}`}
                    key={plan.id}
                    cx="80" cy="80" r="58"
                    pathLength="100"
                    stroke={plan.color}
                    strokeDasharray={`${percentage} ${100 - percentage}`}
                    strokeDashoffset={-offset}
                    tabIndex="0"
                    role="button"
                    aria-label={`${plan.name}: ${plan.count} active organizations`}
                    aria-pressed={selectedPlanId === plan.id}
                    onMouseEnter={() => setHoveredPlanId(plan.id)}
                    onMouseLeave={() => setHoveredPlanId(null)}
                    onFocus={() => setHoveredPlanId(plan.id)}
                    onBlur={() => setHoveredPlanId(null)}
                    onClick={() => setSelectedPlanId(selectedPlanId === plan.id ? null : plan.id)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        setSelectedPlanId(selectedPlanId === plan.id ? null : plan.id);
                      }
                    }}
                  />;
                })}
              </svg>
              <div className="plan-donut-center"><strong>{highlightedPlan ? highlightedPlan.count : totalPlanSubscriptions}</strong><span>{highlightedPlan ? "organizations" : "active plans"}</span></div>
            </div>
            <div className="plan-legend" role="group" aria-label="Filter plan distribution">
              {activePlans.map((plan) => <button className={`plan-legend-row ${highlightedPlan?.id === plan.id ? "selected" : ""}`} key={plan.id} onMouseEnter={() => setHoveredPlanId(plan.id)} onMouseLeave={() => setHoveredPlanId(null)} onFocus={() => setHoveredPlanId(plan.id)} onBlur={() => setHoveredPlanId(null)} onClick={() => setSelectedPlanId(selectedPlanId === plan.id ? null : plan.id)}>
                <span className="plan-legend-dot" style={{ background: plan.color }} /><span className="plan-legend-name">{plan.name}</span><strong>{plan.count}</strong><small>{totalPlanSubscriptions ? Math.round((plan.count / totalPlanSubscriptions) * 100) : 0}%</small>
              </button>)}
            </div>
          </div> : <div className="analytics-empty"><CreditCard size={22} /><strong>No active subscription data</strong><span>Plan distribution will appear here once organizations have active subscriptions.</span></div>}
          {selectedPlan && totalPlanSubscriptions > 0 && <div className="plan-selection-note"><span className="plan-legend-dot" style={{ background: selectedPlan.color }} />{selectedPlan.name} plan · {selectedPlan.count} active {selectedPlan.count === 1 ? "organization" : "organizations"}</div>}
        </article>
      </section>

      <section className="panel analytics-line-panel">
        <div className="analytics-chart-heading">
          <div><span className="analytics-eyebrow">USER DISTRIBUTION</span><h2>Users by organization</h2><p>Line plot of current user counts, ranked from largest to smallest organization.</p></div>
          <span className="analytics-chart-total"><Users size={15} /> Top {lineOrganizations.length} organizations</span>
        </div>
        {linePoints.length ? <>
          <div className="analytics-line-chart-wrap">
            <svg className="analytics-line-chart" viewBox="0 0 760 280" role="group" aria-label="Line graph of users by organization">
              <defs><linearGradient id="userLineFill" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#3b82f6" stopOpacity=".2" /><stop offset="100%" stopColor="#3b82f6" stopOpacity=".015" /></linearGradient></defs>
              {[0, 1, 2, 3, 4].map((tick) => {
                const value = (linePlotMax / 4) * tick;
                const y = linePlotBottom - (value / linePlotMax) * (linePlotBottom - linePlotTop);
                return <g key={tick}><line className="analytics-gridline" x1="68" x2="732" y1={y} y2={y} /><text className="analytics-axis-label" x="54" y={y + 4} textAnchor="end">{value}</text></g>;
              })}
              <path className="analytics-line-area" d={areaPath} />
              <path className="analytics-data-line" d={linePath} />
              {linePoints.map((point) => <g key={point.id} className="analytics-point-group">
                <circle className={`analytics-point ${highlightedLineOrganization?.id === point.id ? "selected" : ""}`} cx={point.x} cy={point.y} r={highlightedLineOrganization?.id === point.id ? 7 : 5} tabIndex="0" role="button" aria-label={`${point.name}: ${point.userCount} users`} aria-pressed={selectedOrganizationId === point.id} onMouseEnter={() => setHoveredLineOrganizationId(point.id)} onMouseLeave={() => setHoveredLineOrganizationId(null)} onFocus={() => setHoveredLineOrganizationId(point.id)} onBlur={() => setHoveredLineOrganizationId(null)} onClick={() => setSelectedOrganizationId(selectedOrganizationId === point.id ? null : point.id)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); setSelectedOrganizationId(selectedOrganizationId === point.id ? null : point.id); } }}><title>{point.name}: {point.userCount} users</title></circle>
                <text className="analytics-x-label" x={point.x} y="246" textAnchor="middle">{point.name.length > 10 ? `${point.name.slice(0, 9)}…` : point.name}</text>
              </g>)}
            </svg>
          </div>
          <div className="analytics-line-footer">{highlightedLineOrganization ? <><strong>{highlightedLineOrganization.name}</strong><span>{highlightedLineOrganization.userCount} {highlightedLineOrganization.userCount === 1 ? "user" : "users"}</span></> : <span>Hover over or select a point to inspect an organization.</span>}</div>
        </> : <div className="analytics-empty"><Users size={22} /><strong>No organization data yet</strong><span>User counts will be plotted here when organization data is available.</span></div>}
      </section>
    </div>
  );
}

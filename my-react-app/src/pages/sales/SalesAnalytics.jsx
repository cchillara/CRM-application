import { useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, ResponsiveContainer, Tooltip,XAxis,YAxis} from "recharts";
import { analyticsActivities, analyticsDeals, analyticsLeads, analyticsTasks,
} from "../../data/salesAnalyticsData.js";
import "./SalesAnalytics.css";

function dateKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function parseDate(value) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function SalesAnalytics() {
  const [period, setPeriod] = useState("30");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayKey = dateKey(today);
  const start = new Date(today);
  if (period === "7") start.setDate(start.getDate() - 6);
  else if (period === "30") {
    start.setDate(start.getDate() - 29);

  }
  else {start.setDate(1);}

  const startKey = dateKey(start);
  
  const isInPeriod = (value) => Boolean(value && value >= startKey && value <= todayKey);

  const periodLeads = analyticsLeads.filter((lead) => isInPeriod(lead.createdAt));
  const periodDeals = analyticsDeals.filter((deal) => isInPeriod(deal.closedAt) && ["WON", "LOST"].includes(deal.status));
  
  const periodTasks = analyticsTasks.filter((task) => isInPeriod(task.createdAt) && task.status !== "CANCELLED");
  const periodActivities = analyticsActivities.filter((activity) => isInPeriod(activity.createdAt));

  const convertedLeads = periodLeads.filter((lead) => isInPeriod(lead.convertedAt)).length;

  const wonDeals = periodDeals.filter((deal) => deal.status === "WON").length;

  const lostDeals = periodDeals.filter((deal) => deal.status === "LOST").length;
  const overdueTasks = periodTasks.filter((task) => task.status !== "COMPLETED" && task.dueDate && task.dueDate < todayKey).length;
  const leadRate = periodLeads.length ? `${Math.round((convertedLeads / periodLeads.length) * 100)}%` : "—";
  const dealRate = wonDeals + lostDeals ? `${Math.round((wonDeals / (wonDeals + lostDeals)) * 100)}%` : "—";

  const bucketDates = [];
  const intervalDays = period === "7" ? 1 : 7;
  for (let offset = 0; offset <= Math.floor((today - start) / 86400000); offset += intervalDays) {
    const bucketDate = new Date(start);
    bucketDate.setDate(start.getDate() + offset);
    bucketDates.push(bucketDate);
  }
  const getBucketIndex = (value) => Math.floor((parseDate(value) - start) / 86400000 / intervalDays);
  const formatBucketLabel = (date) => new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(date);
  const leadTrend = bucketDates.map((date) => ({ name: formatBucketLabel(date), created: 0, converted: 0 }));
  analyticsLeads.forEach((lead) => {
    if (isInPeriod(lead.createdAt)) leadTrend[getBucketIndex(lead.createdAt)].created += 1;
    if (isInPeriod(lead.convertedAt)) leadTrend[getBucketIndex(lead.convertedAt)].converted += 1;
  });
  const dealTrend = bucketDates.map((date) => ({ name: formatBucketLabel(date), won: 0, lost: 0 }));
  periodDeals.forEach((deal) => {
    const bucket = dealTrend[getBucketIndex(deal.closedAt)];
    if (deal.status === "WON") bucket.won += 1;
    if (deal.status === "LOST") bucket.lost += 1;
  });

  const completedTasks = periodTasks.filter((task) => task.status === "COMPLETED").length;
  const pendingTasks = periodTasks.filter((task) => task.status !== "COMPLETED" && !(task.dueDate && task.dueDate < todayKey)).length;
  const taskChartData = [
    { name: "Completed", count: completedTasks, color: "#47977a" },
    { name: "Pending", count: pendingTasks, color: "#3978c5" },
    { name: "Overdue", count: overdueTasks, color: "#c64c4c" },
  ];
  return (
    <div className="sales-analytics-page">
      <header className="sales-analytics-header">
        <div>
          <h1>Analytics</h1>
          <p>Understand your sales performance and identify areas to improve.</p>
        </div>
        <label className="sales-analytics-period-label">
          <span>Reporting period</span>
          <select value={period} onChange={(event) => setPeriod(event.target.value)}>
            <option value="7">Last 7 Days</option>
            <option value="30">Last 30 Days</option>
            <option value="month">This Month</option>
          </select>
        </label>
      </header>

     

      <section className="sales-analytics-kpis" aria-label="Sales performance summary">
        <article className="sales-analytics-kpi"><span>Lead Conversion Rate</span><strong>{leadRate}</strong><small>Leads created and converted in period</small></article>
        <article className="sales-analytics-kpi"><span>Deal Win Rate</span><strong>{dealRate}</strong><small>{wonDeals} won of {wonDeals + lostDeals} closed deals</small></article>
        <article className="sales-analytics-kpi"><span>Activities Completed</span><strong>{periodActivities.length}</strong><small>Logged calls, meetings, emails, and follow-ups</small></article>
        <article className="sales-analytics-kpi"><span>Overdue Tasks</span><strong>{overdueTasks}</strong><small>Incomplete tasks past due today</small></article>
      </section>

      <section className="sales-analytics-chart-grid" >
        <article className="sales-analytics-chart-card sales-analytics-trend-card">
          <div className="sales-analytics-chart-heading"><h2>Lead Conversion Trends</h2><p>Leads created and converted over time</p></div>
          {leadTrend.some((item) => item.created || item.converted) ? (
            <div className="sales-analytics-chart">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={leadTrend} margin={{ top: 8, right: 15, left: -15, bottom: 2 }}>
                  <CartesianGrid stroke="#edf0f4" vertical={false} />
                  <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fill: "#718096", fontSize: 11 }} />
                  <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fill: "#718096", fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="created" name="Leads created" stroke="#3978c5" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                  <Line type="monotone" dataKey="converted" name="Leads converted" stroke="#47977a" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : <p className="sales-analytics-empty">No lead activity in this reporting period.</p>}
        </article>

        <article className="sales-analytics-chart-card">
          <div className="sales-analytics-chart-heading"><h2>Deal Outcomes</h2><p>Won and lost deals closed in period</p></div>
          {periodDeals.length ? (
            <div className="sales-analytics-chart">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dealTrend} margin={{ top: 8, right: 12, left: -15, bottom: 2 }}>
                  <CartesianGrid stroke="#edf0f4" vertical={false} />
                  <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fill: "#718096", fontSize: 11 }} />
                  <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fill: "#718096", fontSize: 11 }} />
                  <Tooltip cursor={false} />
                  <Legend />
                  <Bar dataKey="won" name="Won" fill="#47977a" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="lost" name="Lost" fill="#c64c4c" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : <p className="sales-analytics-empty">No deals were closed in this reporting period.</p>}
        </article>

        <article className="sales-analytics-chart-card">
          <div className="sales-analytics-chart-heading"><h2>Task Completion</h2><p>Tasks created in period by current status</p></div>
          {periodTasks.length ? (
            <div className="sales-analytics-chart">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={taskChartData} margin={{ top: 8, right: 12, left: -15, bottom: 2 }}>
                  <CartesianGrid stroke="#edf0f4" vertical={false} />
                  <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fill: "#718096", fontSize: 11 }} />
                  <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fill: "#718096", fontSize: 11 }} />
                  <Tooltip cursor={false} />
                  <Bar dataKey="count" name="Tasks" radius={[4, 4, 0, 0]}>
                    {taskChartData.map((item) => <Cell key={item.name} fill={item.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : <p className="sales-analytics-empty">No tasks were created in this reporting period.</p>}
        </article>

      </section>
    </div>
  );
}

export default SalesAnalytics;

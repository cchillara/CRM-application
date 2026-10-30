// STEP 1: Add Firebase auth + useEffect (replacing mock data imports)
import { useState, useEffect, useCallback } from "react";
import { auth } from "../../firebase.js";
import { onAuthStateChanged } from "firebase/auth";
import { Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, ResponsiveContainer, Tooltip,XAxis,YAxis} from "recharts";
// REMOVED: import { analyticsActivities, analyticsDeals, analyticsLeads, analyticsTasks } from "../../data/salesAnalyticsData.js";
import "./SalesAnalytics.css";

// STEP 2: Build the API base URL from env (same safe pattern used across all sales pages)
const API_BASE_URL = (import.meta.env.VITE_API_URL || "http://localhost:5000")
  .replace(/\/api\/v1.*$/, "")
  .replace(/\/$/, "");
const SALES_API_URL = `${API_BASE_URL}/api/v1/sales`;

// Map UI period selector values to the API's expected period query param
// UI: "7" | "30" | "month"  →  API: "7d" | "30d" | "90d"
const PERIOD_MAP = { "7": "7d", "30": "30d", "month": "90d" };

// REMOVED: Helper functions dateKey, parseDate (mock data processing no longer needed)
// API now returns pre-computed trends, KPIs, and task counts directly.

function SalesAnalytics() {
  const [period, setPeriod] = useState("30");

  // STEP 3: Live API state — analytics data returned from backend
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // STEP 4: Fetch analytics from live API — GET /api/v1/sales/analytics?period=30d
  const fetchAnalytics = useCallback(async (selectedPeriod) => {
    if (!auth.currentUser) return;
    setLoading(true);
    setError("");
    try {
      const idToken = await auth.currentUser.getIdToken();
      const apiPeriod = PERIOD_MAP[selectedPeriod] || "30d";
      const response = await fetch(`${SALES_API_URL}/analytics?period=${apiPeriod}`, {
        headers: { Authorization: `Bearer ${idToken}` },
      });
      if (!response.ok) throw new Error(`Failed to load analytics (${response.status})`);
      const json = await response.json();
      setAnalytics(json.data);
    } catch (err) {
      setError(err.message || "Failed to load analytics.");
    } finally {
      setLoading(false);
    }
  }, []);

  // STEP 5: Trigger fetch when Firebase auth user is ready
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) fetchAnalytics(period);
      else setLoading(false);
    });
    return unsubscribe;
  }, []);

  // STEP 6: Re-fetch when the period selector changes
  const handlePeriodChange = (event) => {
    const newPeriod = event.target.value;
    setPeriod(newPeriod);
    fetchAnalytics(newPeriod);
  };

  // STEP 7: Derive chart data from live API response shape:
  // analytics.leadConversionTrends = [{ date, created, converted }]
  // analytics.taskCompletion = { COMPLETED, TODO, IN_PROGRESS, CANCELLED }
  // analytics.dealOutcomes = { won, lost }
  // analytics.overview = { leadConversionRate, dealWinRate, activitiesCompleted, overdueTasks }

  const leadTrend = analytics?.leadConversionTrends?.map((item) => ({
    name: new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(new Date(item.date)),
    created: item.created,
    converted: item.converted,
  })) || [];

  const taskCompletion = analytics?.taskCompletion || {};
  const completedTasks = taskCompletion.COMPLETED || 0;
  const pendingTasks = (taskCompletion.TODO || 0) + (taskCompletion.IN_PROGRESS || 0);
  const overdueTasks = analytics?.overview?.overdueTasks || 0;
  const taskChartData = [
    { name: "Completed", count: completedTasks, color: "#47977a" },
    { name: "Pending", count: pendingTasks, color: "#3978c5" },
    { name: "Overdue", count: overdueTasks, color: "#c64c4c" },
  ];

  const dealOutcomes = analytics?.dealOutcomes || { won: 0, lost: 0 };
  const dealChartData = [
    { name: "Won", count: dealOutcomes.won, color: "#47977a" },
    { name: "Lost", count: dealOutcomes.lost, color: "#c64c4c" },
  ];

  const overview = analytics?.overview || {};
  const leadRate = overview.leadConversionRate?.rate != null
    ? `${overview.leadConversionRate.rate}%` : "—";
  const dealRate = overview.dealWinRate?.rate != null
    ? `${overview.dealWinRate.rate}%` : "—";
  const wonDeals = overview.dealWinRate?.won || 0;
  const closedDeals = overview.dealWinRate?.closed || 0;
  const activitiesCompleted = overview.activitiesCompleted || 0;
  return (
    <div className="sales-analytics-page">
      <header className="sales-analytics-header">
        <div>
          <h1>Analytics</h1>
          <p>Understand your sales performance and identify areas to improve.</p>
        </div>
        <label className="sales-analytics-period-label">
          <span>Reporting period</span>
          {/* STEP 8: Period selector now triggers a live API refetch */}
          <select value={period} onChange={handlePeriodChange}>
            <option value="7">Last 7 Days</option>
            <option value="30">Last 30 Days</option>
            <option value="month">This Month</option>
          </select>
        </label>
      </header>

      {/* STEP 9: Show loading / error states */}
      {loading && <p className="sales-form-loading">Loading analytics…</p>}
      {error && <p className="sales-form-error" role="alert">{error}</p>}

      {!loading && !error && analytics && (
        <>
          <section className="sales-analytics-kpis" aria-label="Sales performance summary">
            <article className="sales-analytics-kpi"><span>Lead Conversion Rate</span><strong>{leadRate}</strong><small>Leads created and converted in period</small></article>
            <article className="sales-analytics-kpi"><span>Deal Win Rate</span><strong>{dealRate}</strong><small>{wonDeals} won of {closedDeals} closed deals</small></article>
            <article className="sales-analytics-kpi"><span>Activities Completed</span><strong>{activitiesCompleted}</strong><small>Logged calls, meetings, emails, and follow-ups</small></article>
            <article className="sales-analytics-kpi"><span>Overdue Tasks</span><strong>{overdueTasks}</strong><small>Incomplete tasks past due today</small></article>
          </section>

          <section className="sales-analytics-chart-grid">
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
              <div className="sales-analytics-chart-heading"><h2>Deal Outcomes</h2><p>Won and lost deals</p></div>
              {(dealOutcomes.won + dealOutcomes.lost) > 0 ? (
                <div className="sales-analytics-chart">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dealChartData} margin={{ top: 8, right: 12, left: -15, bottom: 2 }}>
                      <CartesianGrid stroke="#edf0f4" vertical={false} />
                      <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fill: "#718096", fontSize: 11 }} />
                      <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fill: "#718096", fontSize: 11 }} />
                      <Tooltip cursor={false} />
                      <Bar dataKey="count" name="Deals" radius={[4, 4, 0, 0]}>
                        {dealChartData.map((item) => <Cell key={item.name} fill={item.color} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : <p className="sales-analytics-empty">No deals recorded.</p>}
            </article>

            <article className="sales-analytics-chart-card">
              <div className="sales-analytics-chart-heading"><h2>Task Completion</h2><p>Tasks by current status</p></div>
              {(completedTasks + pendingTasks + overdueTasks) > 0 ? (
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
              ) : <p className="sales-analytics-empty">No tasks in this reporting period.</p>}
            </article>
          </section>
        </>
      )}
    </div>
  );
}

export default SalesAnalytics;

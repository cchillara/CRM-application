// STEP 1: Add Firebase auth + useEffect (replacing mock data imports)
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../../firebase.js";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { CircleUserRound, LogOut } from "lucide-react";
import StatCard from "../../components/common/StatCard.jsx";
// REMOVED: import { dashboardStats } from "../../data/salesDashboardData.js";
import "./SalesDashboard.css";
import PipelineCard from "../../components/sales/PipelineCard.jsx";
import TodayTasks from "../../components/sales/TodaysTask.jsx";
import RecentActivities from "../../components/sales/RecentActivities.jsx";
import UpcomingFollowUps from "../../components/sales/UpcomingFollowUps.jsx";

const API_BASE_URL = (import.meta.env.VITE_API_URL || "http://localhost:5000")
  .replace(/\/api\/v1.*$/, "")
  .replace(/\/$/, "");
const SALES_API_URL = `${API_BASE_URL}/api/v1/sales`;

function SalesDashboard() {
  const navigate = useNavigate();

  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/login");
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };
  const fetchDashboard = async () => {
    setLoading(true);
    setError("");
    try {
      const idToken = await auth.currentUser.getIdToken();
      const headers = { Authorization: `Bearer ${idToken}` };
      const [leadsRes, customersRes, tasksRes] = await Promise.all([
        fetch(`${SALES_API_URL}/leads`, { headers }),
        fetch(`${SALES_API_URL}/customers`, { headers }),
        fetch(`${SALES_API_URL}/tasks`, { headers }),
      ]);

      const [leadsJson, customersJson, tasksJson] = await Promise.all([
        leadsRes.ok ? leadsRes.json() : { data: [] },
        customersRes.ok ? customersRes.json() : { data: [] },
        tasksRes.ok ? tasksRes.json() : { data: [] },
      ]);

      const leads = leadsJson.data || [];
      const customers = customersJson.data || [];
      const tasks = tasksJson.data || [];

   
      const qualifiedLeads = leads.filter((l) => l.status === "QUALIFIED").length;
      const todayStr = new Date().toISOString().slice(0, 10);
      const todayTasks = tasks.filter((t) => {
        if (!t.dueDate) return false;
        return t.dueDate.slice(0, 10) === todayStr && t.status !== "COMPLETED" && t.status !== "CANCELLED";
      });

      let firstName = "";
      try {
        const profileRes = await fetch(`${SALES_API_URL}/profile`, { headers });
        if (profileRes.ok) {
          const profileJson = await profileRes.json();
          firstName = profileJson.data?.firstName || "";
        }
      } catch {
      }

      setDashboardData({
        firstName,
        stats: [
          { label: "My Leads", value: String(leads.length) },
          { label: "Qualified Leads", value: String(qualifiedLeads) },
          { label: "My Customers", value: String(customers.length) },
          { label: "Tasks Today", value: String(todayTasks.length) },
        ],
        tasks,
        leads,
        customers,
      });
    } catch (err) {
      setError(err.message || "Failed to load dashboard.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) fetchDashboard();
      else setLoading(false);
    });
    return unsubscribe;
  }, []);

  const greeting = (() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  })();

  const todayLabel = new Date().toLocaleDateString(undefined, {
    month: "long", day: "numeric", year: "numeric",
  });

  return (
    <div className="sales-dashboard">
      <header className="sales-dashboard-header">
        <div className="sales-dashboard-header-left">
          <h1>Dashboard</h1>
        </div>

        <div className="sales-dashboard-header-right">
          <button
            type="button"
            className="sales-dashboard-profile-btn"
            onClick={() => navigate("/profile")}
            title="Profile"
            aria-label="Profile"
          >
            <CircleUserRound size={22} strokeWidth={1.8} />
          </button>

          <button
            type="button"
            className="sales-dashboard-logout-btn"
            onClick={handleLogout}
            title="Logout"
            aria-label="Logout from sales"
          >
            <LogOut size={17} strokeWidth={1.8} />
            <span>Logout</span>
          </button>
        </div>
      </header>

    
      {loading && <p className="sales-form-loading">Loading dashboard…</p>}
      {error && <p className="sales-form-error" role="alert">{error}</p>}

      {!loading && !error && dashboardData && (
        <>
          <section className="sales-dashboard-stats">
            {dashboardData.stats.map((stat) => (
              <StatCard
                key={stat.label}
                label={stat.label}
                value={stat.value}
              />
            ))}
          </section>

          <section className="sales-dashboard-main-grid">
            {/* PipelineCard and TodayTasks receive live data as props */}
            <PipelineCard leads={dashboardData.leads} />
            <TodayTasks tasks={dashboardData.tasks} />
          </section>

          <section className="sales-dashboard-secondary-grid">
            {/* RecentActivities and UpcomingFollowUps receive live data as props */}
            <RecentActivities tasks={dashboardData.tasks} />
            <UpcomingFollowUps leads={dashboardData.leads} />
          </section>
        </>
      )}
    </div>
  );
}

export default SalesDashboard;

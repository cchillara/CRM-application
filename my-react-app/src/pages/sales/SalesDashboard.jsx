import PageHeader from "../../components/common/PageHeader.jsx";
import StatCard from "../../components/common/StatCard.jsx";
import { dashboardStats} from "../../data/salesDashboardData.js";
import "./SalesDashboard.css";
import PipelineCard from "../../components/sales/PipelineCard.jsx";
import TodayTasks from "../../components/sales/TodaysTask.jsx";
import RecentActivities from "../../components/sales/RecentActivities.jsx";
import UpcomingFollowUps from "../../components/sales/UpcomingFollowUps.jsx";
function SalesDashboard() {
  return (
    <div className="sales-dashboard">
      <PageHeader
        eyebrow="Sales Overview"
        title="Good morning Subham"
        description="Sales Activity - Today"
        dateLabel="October 6, 2026"
      />

      <section className="sales-dashboard-stats">
        {dashboardStats.map((stat) => (
          <StatCard
            key={stat.label}
            label={stat.label}
            value={stat.value}
            change={stat.change}
            trend={stat.trend}
          />
        ))}
      </section>
       <section className="sales-dashboard-main-grid">
        <PipelineCard />
        <TodayTasks />
      </section>

      <section className="sales-dashboard-secondary-grid">
        <RecentActivities />
        <UpcomingFollowUps />
      </section>
    </div>
  );
}

export default SalesDashboard;

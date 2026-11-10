// STEP: RecentActivities now receives live tasks[] as a prop (replacing mock recentActivities import)
// REMOVED: import { recentActivities } from "../../data/salesDashboardData.js"
import { BriefcaseBusiness, Phone, UserPlus, CalendarClock, CheckSquare } from "lucide-react";
import "./RecentActivities.css";

// Map task types/statuses to an icon for the activity list
const activityIcons = {
  CALL: Phone,
  MEETING: CalendarClock,
  FOLLOW_UP: CalendarClock,
  deal: BriefcaseBusiness,
  customer: UserPlus,
};

// Format a relative time label (e.g. "2 hours ago") from an ISO date string
function relativeTime(isoString) {
  if (!isoString) return "";
  const diff = Date.now() - new Date(isoString).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

function RecentActivities({ tasks = [] }) {
  // Show the 5 most recently created tasks as "recent activities"
  const recentTasks = [...tasks]
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
    .slice(0, 5);

  return (
    <section className="sales-recent-activities">
      <div className="sales-section-header">
        <div>
          <h2>Recent Activities</h2>
          <p>Latest updates from your sales activity.</p>
        </div>
      </div>

      <div className="sales-activity-list">
        {recentTasks.length === 0 && (
          <p style={{ color: "#718096", fontSize: 14 }}>No recent activity.</p>
        )}
        {recentTasks.map((task) => {
          const Icon = activityIcons[task.type] || CheckSquare;
          return (
            <div className="sales-activity-item" key={task.id}>
              <div className="sales-activity-icon">
                <Icon size={16} strokeWidth={1.8} />
              </div>

              <div className="sales-activity-content">
                <div className="sales-activity-title">{task.title}</div>
                <div className="sales-activity-description">
                  {task.status?.charAt(0) + (task.status?.slice(1).toLowerCase().replace(/_/g, " ") || "")}
                </div>
              </div>

              <span className="sales-activity-time">
                {relativeTime(task.createdAt)}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default RecentActivities;

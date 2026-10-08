import { BriefcaseBusiness, Phone, UserPlus, CalendarClock} from "lucide-react";
import { recentActivities } from "../../data/salesDashboardData.js";
import "./RecentActivities.css";

const activityIcons = {
  call: Phone,
  deal: BriefcaseBusiness,
  customer: UserPlus,
  followup: CalendarClock
};

function RecentActivities() {
  return (
    <section className="sales-recent-activities">
      <div className="sales-section-header">
        <div>
          <h2>Recent Activities</h2>
          <p>Latest updates from your sales activity.</p>
        </div>

      </div>

      <div className="sales-activity-list">
        {recentActivities.map((activity) => {
          const Icon = activityIcons[activity.type];

          return (
            <div className="sales-activity-item" key={activity.id}>
              <div className="sales-activity-icon">
                <Icon size={16} strokeWidth={1.8} />
              </div>

              <div className="sales-activity-content">
                <div className="sales-activity-title">
                  {activity.title}
                </div>
                <div className="sales-activity-description">
                  {activity.description}
                </div>
              </div>

              <span className="sales-activity-time">
                {activity.time}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default RecentActivities;

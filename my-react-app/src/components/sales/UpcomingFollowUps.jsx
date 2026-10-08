import { CalendarClock } from "lucide-react";
import { upcomingFollowUps } from "../../data/salesDashboardData.js";
import "./UpcomingFollowUps.css";

function UpcomingFollowUps() {
  return (
    <section className="sales-upcoming-followups">
      <div className="sales-section-header">
        <div>
          <h2>Upcoming Follow-ups</h2>
          <p>Stay on top of your scheduled follow-ups.</p>
        </div>

      </div>

      <div className="sales-followup-list">
        {upcomingFollowUps.map((followup) => (
          <div className="sales-followup-item" key={followup.id}>
            <div className="sales-followup-icon">
              <CalendarClock size={16} strokeWidth={1.8} />
            </div>

            <div className="sales-followup-content">
              <div className="sales-followup-customer">
                {followup.customer}
              </div>
              <div className="sales-followup-meta">
                {followup.contact}
                <span>{followup.date} · {followup.time}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default UpcomingFollowUps;

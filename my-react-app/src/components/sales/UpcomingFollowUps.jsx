// STEP: UpcomingFollowUps now receives live leads[] as a prop (replacing mock upcomingFollowUps import)
// REMOVED: import { upcomingFollowUps } from "../../data/salesDashboardData.js"
import { CalendarClock } from "lucide-react";
import "./UpcomingFollowUps.css";

// Format a follow-up date label relative to today
function followUpDateLabel(isoString) {
  if (!isoString) return "";
  const date = new Date(isoString);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);

  if (target.getTime() === today.getTime()) return "Today";
  if (target.getTime() === tomorrow.getTime()) return "Tomorrow";
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function UpcomingFollowUps({ leads = [] }) {
  const todayStr = new Date().toISOString().slice(0, 10);

  // Show leads that have a followUpDate >= today, sorted soonest first, max 5
  const upcomingLeads = leads
    .filter((lead) => lead.followUpDate && lead.followUpDate.slice(0, 10) >= todayStr)
    .sort((a, b) => new Date(a.followUpDate) - new Date(b.followUpDate))
    .slice(0, 5);

  return (
    <section className="sales-upcoming-followups">
      <div className="sales-section-header">
        <div>
          <h2>Upcoming Follow-ups</h2>
          <p>Stay on top of your scheduled follow-ups.</p>
        </div>
      </div>

      <div className="sales-followup-list">
        {upcomingLeads.length === 0 && (
          <p style={{ color: "#718096", fontSize: 14 }}>No upcoming follow-ups.</p>
        )}
        {upcomingLeads.map((lead) => (
          <div className="sales-followup-item" key={lead.id}>
            <div className="sales-followup-icon">
              <CalendarClock size={16} strokeWidth={1.8} />
            </div>

            <div className="sales-followup-content">
              <div className="sales-followup-customer">
                {lead.companyName || lead.contactName || "—"}
              </div>
              <div className="sales-followup-meta">
                {lead.contactName}
                <span>{followUpDateLabel(lead.followUpDate)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default UpcomingFollowUps;

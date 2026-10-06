import { useState } from "react";
import DetailsModal from "../components/DetailsModal";

const metrics = [
  { label: "Organization Growth", value: "+12", note: "This month", rows: [["New organizations", "12"], ["Previous month", "9"], ["Growth", "+33%"]] },
  { label: "User Growth", value: "+8.1%", note: "Month over month", rows: [["Current users", "2,450"], ["New users", "184"], ["Growth", "+8.1%"]] },
  { label: "Paid Conversion", value: "87.5%", note: "112 active subscriptions", rows: [["Organizations", "128"], ["Paid", "112"], ["Conversion", "87.5%"]] },
  { label: "Support Resolution", value: "92%", note: "Last 30 days", rows: [["Resolved", "46"], ["Open", "7"], ["Resolution rate", "92%"]] }
];

export default function Analytics() {
  const [selected, setSelected] = useState(null);

  return (
    <>
      <section className="stats-grid analytics-stats">
        {metrics.map((metric) => (
          <button
            className="stat-card"
            key={metric.label}
            onClick={() => setSelected(metric)}
          >
            <span>{metric.label}</span>
            <strong>{metric.value}</strong>
            <small>{metric.note}</small>
          </button>
        ))}
      </section>

      <section className="panel analytics-panel">
        <div className="panel-title">
          <div>
            <h3>Platform Summary</h3>
            <p>Simple monthly comparison</p>
          </div>
        </div>

        <div className="simple-metrics">
          <div><span>Organizations</span><strong>128</strong></div>
          <div><span>Active Users</span><strong>2,450</strong></div>
          <div><span>Subscriptions</span><strong>112</strong></div>
          <div><span>Monthly Revenue</span><strong>₹18.5L</strong></div>
        </div>
      </section>

      <DetailsModal
        title={selected?.label}
        rows={selected?.rows || []}
        onClose={() => setSelected(null)}
      />
    </>
  );
}

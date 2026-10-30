// STEP: PipelineCard now receives live leads[] as a prop (replacing mock pipelineData import)
// REMOVED: import { pipelineData } from '../../data/salesDashboardData.js'
import "./PipelineCard.css"

// Group leads by their status to build a pipeline view
// Each unique lead status becomes a "stage" row in the pipeline card
function PipelineCard({ leads = [] }) {
  // Build pipeline stages from live leads grouped by status
  const stageCounts = leads.reduce((accumulator, lead) => {
    const stage = lead.status || "UNKNOWN";
    accumulator[stage] = (accumulator[stage] || 0) + 1;
    return accumulator;
  }, {});

  // Convert to an array and sort by count descending for display
  const pipelineData = Object.entries(stageCounts).map(([stage, count]) => ({
    stage: stage.charAt(0) + stage.slice(1).toLowerCase().replace(/_/g, " "),
    count,
  })).sort((a, b) => b.count - a.count);

  const maxCount = pipelineData.reduce((maximum, item) => Math.max(maximum, item.count), 0) || 1;

  return (
    <section className="sales-pipeline-card">
      <div className="sales-pipeline-header">
        <div>
          <h2>Sales pipeline</h2>
          <p>Track active leads by stage</p>
        </div>
      </div>

      <div className="sales-pipeline-list">
        {pipelineData.length === 0 && (
          <p style={{ color: "#718096", fontSize: 14 }}>No leads yet.</p>
        )}
        {pipelineData.map((item) => (
          <div className="sales-pipeline-row" key={item.stage}>
            <div className="sales-pipeline-row-heading">
              <div className="sales-pipeline-stage">
                <span>{item.stage}</span>
                <strong>{item.count} {item.count === 1 ? "lead" : "leads"}</strong>
              </div>
            </div>

            <div
              className="sales-pipeline-bar"
              role="progressbar"
              aria-label={`${item.stage} leads`}
              aria-valuemin={0}
              aria-valuemax={maxCount}
              aria-valuenow={item.count}
            >
              <span style={{ width: `${(item.count / maxCount) * 100}%` }} />
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

export default PipelineCard

import "./PipelineCard.css"
import { pipelineData } from '../../data/salesDashboardData.js'

const maxCount = pipelineData.reduce(
  (maximum, item) => Math.max(maximum, item.count),
  0
)

function PipelineCard() {
  return (
    <section className="sales-pipeline-card">
      <div className="sales-pipeline-header">
        <div>
          <h2>Sales pipeline</h2>
          <p>Track active deals</p>
        </div>
      </div>

      <div className="sales-pipeline-list">
        {pipelineData.map((item) => (
          <div className="sales-pipeline-row" key={item.stage}>
            <div className="sales-pipeline-row-heading">
              <div className="sales-pipeline-stage">
                <span>{item.stage}</span>
                <strong>{item.count} deals</strong>
              </div>
              <span className="sales-pipeline-value">{item.value}</span>
            </div>

            <div
              className="sales-pipeline-bar"
              role="progressbar"
              aria-label={`${item.stage} deals`}
              aria-valuemin={0}
              aria-valuemax={maxCount}
              aria-valuenow={item.count}
            >
              <span
                style={{
                  width: `${(item.count / maxCount) * 100}%`
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

export default PipelineCard

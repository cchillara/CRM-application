import { Clock3 } from "lucide-react"
import { todayTasks } from "../../data/salesDashboardData.js"
import "./TodaysTask.css"

function TodayTasks() {
  return (
    <section className="sales-today-tasks">
      <div className="sales-section-header">
        <div>
          <h2>Today's Tasks</h2>
          <p>Your scheduled activities for today.</p>
        </div>
      </div>

      <div className="sales-task-list">
        {todayTasks.map((task) => (
          <div className="sales-task-item" key={task.id}>
            <div className="sales-task-check">
              <span />
            </div>

            <div className="sales-task-content">
              <h3>{task.title}</h3>
              <div className="sales-task-meta">
                <span>{task.type}</span>
                <span className="sales-task-divider">•</span>
                <Clock3 size={13} strokeWidth={1.8} />
                <span>{task.time}</span>
              </div>
            </div>

            <span
              className={`sales-task-priority ${task.priority.toLowerCase()}`}
            >
              {task.priority}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

export default TodayTasks;

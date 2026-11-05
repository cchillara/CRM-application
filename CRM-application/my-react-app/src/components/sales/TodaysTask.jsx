
import { Clock3 } from "lucide-react"
import "./TodaysTask.css"

function TodayTasks({ tasks = [] }) {
  const todayStr = new Date().toISOString().slice(0, 10);

  const todayTasks = tasks.filter((task) => {
    if (!task.dueDate) return false;
    return (
      task.dueDate.slice(0, 10) === todayStr &&
      task.status !== "COMPLETED" &&
      task.status !== "CANCELLED"
    );
  });


  const formatTime = (isoString) => {
    if (!isoString) return "";
    const date = new Date(isoString);
    return date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  };

  return (
    <section className="sales-today-tasks">
      <div className="sales-section-header">
        <div>
          <h2>Today{"'"}s Tasks</h2>
          <p>Your scheduled activities for today.</p>
        </div>
      </div>

      <div className="sales-task-list">
        {todayTasks.length === 0 && (
          <p style={{ color: "#718096", fontSize: 14 }}>No tasks due today.</p>
        )}
        {todayTasks.map((task) => (
          <div className="sales-task-item" key={task.id}>
            <div className="sales-task-check">
              <span />
            </div>

            <div className="sales-task-content">
              <h3>{task.title}</h3>
              <div className="sales-task-meta">
                <span>{task.type || task.status}</span>
                {task.dueDate && (
                  <>
                    <span className="sales-task-divider">•</span>
                    <Clock3 size={13} strokeWidth={1.8} />
                    <span>{formatTime(task.dueDate)}</span>
                  </>
                )}
              </div>
            </div>

            {/* Show priority if available */}
            {task.priority && (
              <span className={`sales-task-priority ${task.priority.toLowerCase()}`}>
                {task.priority}
              </span>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

export default TodayTasks;

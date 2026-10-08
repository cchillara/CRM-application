import { useMemo, useState } from "react";
import { Ellipsis, Search, Trash2 } from "lucide-react";
import DataTable from "../../components/common/DataTable.jsx";
import StatusBadge from "../../components/common/StatusBadge.jsx";
import { salesTasks } from "../../data/salesTasksData.js";
import "./SalesTasks.css";

const taskTabs = [
  { label: "All Tasks", value: "ALL" },
  { label: "To Do", value: "TODO" },
  { label: "In Progress", value: "IN_PROGRESS" },
  { label: "Completed", value: "COMPLETED" },
  { label: "Cancelled", value: "CANCELLED" },
];

const statusVariants = {
  TODO: "neutral",
  IN_PROGRESS: "info",
  COMPLETED: "success",
  CANCELLED: "danger",
};

function getTodayString() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function SalesTasks() {
  const [tasks, setTasks] = useState(salesTasks);
  const [activeTab, setActiveTab] = useState("ALL");
  const [search, setSearch] = useState("");
  const [dueDateFilter, setDueDateFilter] = useState("ALL");
  const [openMenuTaskId, setOpenMenuTaskId] = useState(null);

  const handleTaskCompletion = (taskId, isCompleted) => {
    setTasks((currentTasks) =>
      currentTasks.map((task) =>
        task.id === taskId
          ? { ...task, status: isCompleted ? "COMPLETED" : "TODO" }
          : task
      )
    );
  };

  const handleDeleteTask = (taskId) => {
    setTasks((currentTasks) => currentTasks.filter((task) => task.id !== taskId));
    setOpenMenuTaskId(null);
  };

  const filteredTasks = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    const today = getTodayString();
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    const nextWeekString = `${nextWeek.getFullYear()}-${String(nextWeek.getMonth() + 1).padStart(2, "0")}-${String(nextWeek.getDate()).padStart(2, "0")}`;

    return tasks.filter((task) => {
      const matchesTab = activeTab === "ALL" || task.status === activeTab;
      const searchableValues = [
        task.title,
        task.description,
        task.relatedTo?.type,
        task.relatedTo?.name,
      ];
      const matchesSearch =
        !normalizedSearch ||
        searchableValues.some((value) => value?.toLowerCase().includes(normalizedSearch));

      let matchesDueDate = true;
      if (dueDateFilter === "OVERDUE") {
        matchesDueDate =
          Boolean(task.dueDate) &&
          task.dueDate < today &&
          task.status !== "COMPLETED" &&
          task.status !== "CANCELLED";
      } else if (dueDateFilter === "TODAY") {
        matchesDueDate = task.dueDate === today;
      } else if (dueDateFilter === "NEXT_7_DAYS") {
        matchesDueDate = Boolean(task.dueDate) && task.dueDate >= today && task.dueDate <= nextWeekString;
      } else if (dueDateFilter === "NO_DATE") {
        matchesDueDate = !task.dueDate;
      }

      return matchesTab && matchesSearch && matchesDueDate;
    });
  }, [activeTab, dueDateFilter, search, tasks]);

  return (
    <div className="sales-tasks-page">
      <header className="sales-tasks-header">
        <div>
          <h1>Tasks</h1>
          <p>Manage your upcoming and pending work.</p>
        </div>
      </header>

      <section className="sales-tasks-card" aria-label="Tasks">
        <div className="sales-tasks-toolbar">
          <div className="sales-tasks-tabs" role="tablist" aria-label="Task views">
            {taskTabs.map((tab) => (
              <button
                key={tab.value}
                className={`sales-tasks-tab ${activeTab === tab.value ? "active" : ""}`}
                type="button"
                role="tab"
                aria-selected={activeTab === tab.value}
                onClick={() => setActiveTab(tab.value)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="sales-tasks-filters">
            <div className="sales-tasks-search">
              <Search size={17} strokeWidth={1.8} aria-hidden="true" />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search tasks"
                aria-label="Search tasks"
              />
            </div>
            <div className="sales-tasks-select-label">
              <select
                aria-label="Filter tasks by due date"
                value={dueDateFilter}
                onChange={(event) => setDueDateFilter(event.target.value)}
              >
                <option value="ALL">All due dates</option>
                <option value="OVERDUE">Overdue</option>
                <option value="TODAY">Due today</option>
                <option value="NEXT_7_DAYS">Next 7 days</option>
                <option value="NO_DATE">No due date</option>
              </select>
            </div>
          </div>
        </div>

        <DataTable
          headers={["Task", "Related To", "Due Date", "Status", "Actions"]}
          emptyMessage="No tasks match your search or filters."
          tableClassName="sales-tasks-table"
        >
          {filteredTasks.map((task) => (
            <tr key={task.id}>
              <td>
                <div className="sales-tasks-task-row">
                  <input
                    className="sales-tasks-completion-checkbox"
                    type="checkbox"
                    checked={task.status === "COMPLETED"}
                    disabled={task.status === "CANCELLED"}
                    aria-label={`${task.status === "COMPLETED" ? "Mark as not completed" : "Mark as completed"}: ${task.title}`}
                    onChange={(event) => handleTaskCompletion(task.id, event.target.checked)}
                  />
                  <span className="sales-tasks-task-copy">
                    <span className="sales-tasks-title">{task.title}</span>
                    {task.description && (
                      <span className="sales-tasks-description">{task.description}</span>
                    )}
                  </span>
                </div>
              </td>
              <td>
                {task.relatedTo ? (
                  <span className="sales-tasks-related-copy">
                    <span className="sales-tasks-related-name">{task.relatedTo.name}</span>
                    <span className="sales-tasks-related-type">{task.relatedTo.type}</span>
                  </span>
                ) : (
                  <span className="sales-tasks-related-type">—</span>
                )}
              </td>
              <td><span className="sales-tasks-due-date">{task.dueDate || "No due date"}</span></td>
              <td>
                <StatusBadge status={task.status} variant={statusVariants[task.status] ?? "neutral"} />
              </td>
              <td>
                <div className="sales-tasks-actions">
                  <button
                    className="sales-tasks-row-action"
                    type="button"
                    aria-label={`More actions for ${task.title}`}
                    aria-haspopup="menu"
                    aria-expanded={openMenuTaskId === task.id}
                    onClick={() => setOpenMenuTaskId((currentId) => currentId === task.id ? null : task.id)}
                  >
                    <Ellipsis size={19} strokeWidth={1.8} />
                  </button>
                  {openMenuTaskId === task.id && (
                    <div className="sales-tasks-action-menu" role="menu">
                      <button
                        className="sales-tasks-delete-action"
                        type="button"
                        role="menuitem"
                        onClick={() => handleDeleteTask(task.id)}
                      >
                        <Trash2 size={15} strokeWidth={1.8} />
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </DataTable>
      </section>
    </div>
  );
}

export default SalesTasks;

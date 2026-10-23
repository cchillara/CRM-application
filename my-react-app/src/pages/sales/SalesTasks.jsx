import { useCallback, useEffect, useMemo, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { Ellipsis, Search, Trash2 } from "lucide-react";
import DataTable from "../../components/common/DataTable.jsx";
import ConfirmDialog from "../../components/common/ConfirmDialog.jsx";
import StatusBadge from "../../components/common/StatusBadge.jsx";
import AddButton from "../../components/sales/AddButton.jsx";
import TaskForm from "../../components/sales/TaskForm.jsx";
import { auth } from "../../firebase.js";
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

const API_BASE_URL = (import.meta.env.VITE_API_URL || "http://localhost:5000").replace(/\/$/, "");
const SALES_API_URL = `${API_BASE_URL}/api/v1/sales`;

function mapTask(task) {
  const relatedTo = task.lead
    ? { type: "Lead", name: task.lead.title }
    : task.customer
      ? { type: "Customer", name: task.customer.company.name }
      : task.deal
        ? { type: "Deal", name: task.deal.title }
        : null;

  return {
    ...task,
    dueDate: task.dueDate ? task.dueDate.slice(0, 10) : null,
    relatedTo,
  };
}

function getTodayString() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function SalesTasks() {
  const [tasks, setTasks] = useState([]);
  const [leads, setLeads] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [activeTab, setActiveTab] = useState("ALL");
  const [search, setSearch] = useState("");
  const [dueDateFilter, setDueDateFilter] = useState("ALL");
  const [openMenuTaskId, setOpenMenuTaskId] = useState(null);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchTaskPageData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const idToken = await auth.currentUser.getIdToken();
      const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${idToken}`,
      };
      const [tasksResponse, leadsResponse, customersResponse] = await Promise.all([
        fetch(`${SALES_API_URL}/tasks`, { headers }),
        fetch(`${SALES_API_URL}/leads`, { headers }),
        fetch(`${SALES_API_URL}/customers`, { headers }),
      ]);
      const [tasksResult, leadsResult, customersResult] = await Promise.all([
        tasksResponse.json(),
        leadsResponse.json(),
        customersResponse.json(),
      ]);

      if (!tasksResponse.ok || tasksResult.success === false) {
        throw new Error(tasksResult.message || "Unable to load tasks.");
      }
      if (!leadsResponse.ok || leadsResult.success === false) {
        throw new Error(leadsResult.message || "Unable to load leads.");
      }
      if (!customersResponse.ok || customersResult.success === false) {
        throw new Error(customersResult.message || "Unable to load customers.");
      }

      setTasks(Array.isArray(tasksResult.data) ? tasksResult.data.map(mapTask) : []);
      setLeads(Array.isArray(leadsResult.data) ? leadsResult.data : []);
      setCustomers(Array.isArray(customersResult.data) ? customersResult.data : []);
    } catch (requestError) {
      setTasks([]);
      setLeads([]);
      setCustomers([]);
      setError(requestError.message || "Unable to load tasks.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => onAuthStateChanged(auth, (user) => {
    if (user) {
      fetchTaskPageData();
    } else {
      setTasks([]);
      setLeads([]);
      setCustomers([]);
      setLoading(false);
    }
  }), [fetchTaskPageData]);

  const relatedOptions = useMemo(() => {
    const leadOptions = leads.map((lead) => ({
      id: lead.id,
      type: "Lead",
      name: [lead.contact?.firstName, lead.contact?.lastName].filter(Boolean).join(" ") || lead.title,
    }));
    const customerOptions = customers.map((customer) => ({
      id: customer.id,
      type: "Customer",
      name: customer.name,
    }));
    const dealOptions = Array.from(new Map(tasks
      .filter((task) => task.deal)
      .map((task) => [task.deal.id, { id: task.deal.id, type: "Deal", name: task.deal.title }])).values());

    return [...leadOptions, ...customerOptions, ...dealOptions];
  }, [customers, leads, tasks]);

  const handleCreateTask = async (values) => {
    try {
      const idToken = await auth.currentUser.getIdToken();
      const response = await fetch(`${SALES_API_URL}/tasks`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify(values),
      });
      const result = await response.json();

      if (!response.ok || result.success === false) {
        throw new Error(result.message || "Unable to create task.");
      }

      setTasks((currentTasks) => [mapTask(result.data), ...currentTasks]);
      setShowTaskForm(false);
      setError("");
    } catch (requestError) {
      setError(requestError.message || "Unable to create task.");
      throw requestError;
    }
  };

  const handleTaskCompletion = async (taskId, isCompleted) => {
    try {
      const idToken = await auth.currentUser.getIdToken();
      const response = await fetch(`${SALES_API_URL}/tasks/${encodeURIComponent(taskId)}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ status: isCompleted ? "COMPLETED" : "TODO" }),
      });
      const result = await response.json();

      if (!response.ok || result.success === false) {
        throw new Error(result.message || "Unable to update task status.");
      }

      const updatedTask = mapTask(result.data);
      setTasks((currentTasks) => currentTasks.map((currentTask) =>
        currentTask.id === taskId ? updatedTask : currentTask
      ));
      setError("");
    } catch (requestError) {
      setError(requestError.message || "Unable to update task status.");
    }
  };

  const handleDeleteTask = async () => {
    try {
      const idToken = await auth.currentUser.getIdToken();
      const response = await fetch(`${SALES_API_URL}/tasks/${encodeURIComponent(taskToDelete.id)}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
      });

      const result = await response.json();
      if (!response.ok || result.success === false) {
        throw new Error(result.message || "Unable to delete task.");
      }

      setTasks((currentTasks) => currentTasks.filter((task) => task.id !== taskToDelete.id));
      setOpenMenuTaskId(null);
      setTaskToDelete(null);
      setError("");
    } catch (requestError) {
      setTaskToDelete(null);
      setError(requestError.message || "Unable to delete task.");
    }
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
        <AddButton onClick={() => setShowTaskForm(true)}>Add Task</AddButton>
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

        {error && <p className="sales-tasks-error" role="alert">{error}</p>}
        {loading && <p className="sales-tasks-loading" role="status">Loading tasks…</p>}
        <DataTable
          headers={["Task", "Related To", "Due Date", "Status", "Actions"]}
          emptyMessage={loading ? "Loading tasks…" : error ? "Tasks could not be loaded." : "No tasks match your search or filters."}
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
                        onClick={() => { setTaskToDelete(task); setOpenMenuTaskId(null); }}
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
      {showTaskForm && <TaskForm onClose={() => setShowTaskForm(false)} relatedOptions={relatedOptions} onSubmit={handleCreateTask} />}
      {taskToDelete && <ConfirmDialog title="Delete task?" message={`Are you sure you want to delete “${taskToDelete.title}”? This action cannot be undone.`} onCancel={() => setTaskToDelete(null)} onConfirm={handleDeleteTask} />}
    </div>
  );
}

export default SalesTasks;

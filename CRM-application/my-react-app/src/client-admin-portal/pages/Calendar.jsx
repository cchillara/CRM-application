import React, { useState, useEffect } from "react";
import {
  Plus,
  X,
  CalendarDays,
  CheckCircle2,
  Clock,
  Trash2,
  Check,
  RefreshCw,
  User,
  Building,
  AlertCircle,
  Flag,
  Clock3,
  Pencil
} from "lucide-react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { getTasks, createTask, updateTask, deleteTask } from "../Api/Tasks";
import { tasksList as fallbackTasks } from "../data";

export default function Calendar() {
  const today = new Date();


  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);


  const [selectedEventId, setSelectedEventId] = useState(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentView, setCurrentView] = useState("month");

  const dateRange = {
    start: new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      1
    ),
    end: new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() + 1,
      1
    )
  };

  const [showForm, setShowForm] = useState(false);
  const [newTask, setNewTask] = useState({
    title: "",
    client: "General",
    assignedTo: "Sarah Jenkins",
    dueDate: formatDate(today),
    priority: "Medium"
  });

  function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }


  const parseToISODate = (dateInput) => {
    if (!dateInput) return formatDate(new Date());
    if (typeof dateInput === "string" && /^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
      return dateInput;
    }
    if (typeof dateInput === "string" && dateInput.includes("T")) {
      return dateInput.split("T")[0];
    }
    const lower = String(dateInput).toLowerCase().trim();
    const now = new Date();
    if (lower === "today") {
      return formatDate(now);
    }
    if (lower === "tomorrow") {
      const tmrw = new Date(now.getTime() + 86400000);
      return formatDate(tmrw);
    }
    if (lower === "yesterday") {
      const yest = new Date(now.getTime() - 86400000);
      return formatDate(yest);
    }
    const d = new Date(dateInput);
    if (!isNaN(d.getTime())) {
      return formatDate(d);
    }
    return formatDate(now);
  };


  const OWNER_NAMES = ['Sarah Jenkins', 'David Miller', 'Arjun Kumar', 'Elena Rostova', 'Marcus Vance', 'Meena Patel', 'Vikram Singh'];

  const resolveOwnerName = (raw, fallbackSeed = 0) => {
    if (typeof raw === 'string') {
      const trimmed = raw.trim();
      if (trimmed && trimmed !== 'Client Admin' && trimmed !== '—' && trimmed !== 'Unknown') {
        return trimmed;
      }
    } else if (raw && typeof raw === 'object') {
      const full = `${raw.firstName || ''} ${raw.lastName || ''}`.trim();
      if (full && full !== 'Client Admin') return full;
    }
    const idx = typeof fallbackSeed === 'number'
      ? Math.abs(fallbackSeed) % OWNER_NAMES.length
      : Math.abs(String(fallbackSeed).split('').reduce((sum, c) => sum + c.charCodeAt(0), 0)) % OWNER_NAMES.length;
    return OWNER_NAMES[idx];
  };

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const data = await getTasks();
      if (Array.isArray(data)) {
        const cleaned = (data.length > 0 ? data : fallbackTasks).map((t, idx) => ({
          ...t,
          assignedTo: resolveOwnerName(t.assignedTo, t.title || idx)
        }));
        setTasks(cleaned);
      } else {
        setTasks(fallbackTasks);
      }
    } catch (err) {
      console.warn("[Calendar] API unavailable, using fallback:", err.message);
      setTasks(fallbackTasks);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const totalEvents = tasks.length;
  const completedCount = tasks.filter(
    (t) => t.completed === true
  ).length;
  const pendingCount = totalEvents - completedCount;

  function displayDate(date) {
    return new Intl.DateTimeFormat("en-US", { weekday: "short", month: "short", day: "numeric" }).format(date);
  }

  function displayTime(date) {
    return new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" }).format(date);
  }

  const calendarEvents = tasks.map((task, idx) => {
    const startDate = parseToISODate(task.due || task.dueDate || task.start);
    const isCompleted = task.completed === true;
    const finalOwner = resolveOwnerName(task.assignedTo, task.title || idx);

    return {
      id: String(task.id),
      title: task.title,
      start: startDate,
      end: task.end || null,
      type: task.type || task.priority || "Task",
      relatedTo: task.relatedTo || task.client || null,
      notes: task.notes || task.description || "",
      extendedProps: {
        id: task.id,
        priority: task.priority,
        assignedTo: finalOwner,
        client: task.client,
        status: task.status || (isCompleted ? "COMPLETED" : "TODO"),
        completed: isCompleted,
        rawDue: task.due || startDate
      }
    };
  });

  const selectedEvent = calendarEvents.find((event) => String(event.id) === String(selectedEventId)) || null;

  const relatedNames = new Proxy({}, {
    get: (target, prop) => target[prop] || prop || "Record unavailable"
  });

  const agendaEvents = calendarEvents.filter((event) => {
    const eventStart = new Date(`${event.start.slice(0, 10)}T00:00:00`);

    return (
      eventStart >= dateRange.start &&
      eventStart < dateRange.end
    );
  });

  const handleEventClick = (info) => {
    setSelectedEventId(info.event.id);
  };

  function openEditEvent() {
    if (!selectedEvent) return;
    const taskToEdit = tasks.find((t) => String(t.id) === String(selectedEvent.id));
    setNewTask({
      title: selectedEvent.title || "",
      client: selectedEvent.relatedTo || selectedEvent.extendedProps?.client || "",
      assignedTo: selectedEvent.extendedProps?.assignedTo || "",
      dueDate: selectedEvent.start ? parseToISODate(selectedEvent.start) : formatDate(today),
      priority: selectedEvent.extendedProps?.priority || "Medium"
    });
    setEditingTask(taskToEdit || selectedEvent);
    setSelectedEventId(null);
    setShowForm(true);
  }

  async function deleteEvent() {
    if (!selectedEvent) return;
    const eventId = selectedEvent.id;
    setTasks((previousTasks) =>
      previousTasks.filter((t) => String(t.id) !== String(eventId))
    );
    setSelectedEventId(null);
    setDeleteConfirmation(false);
    try {
      await deleteTask(eventId);
    } catch (err) {
      console.warn("[Calendar] Delete task API error:", err.message);
    }
  }

  function openAddTask() {
    setEditingTask(null);
    setNewTask({
      title: "",
      client: "",
      assignedTo: "",
      dueDate: formatDate(today),
      priority: ""
    });
    setShowForm(true);
  }

  async function handleSaveTask(e) {
    e.preventDefault();

    if (!newTask.title.trim() || !newTask.dueDate) {
      return;
    }

    const payload = {
      title: newTask.title.trim(),
      client: newTask.client.trim(),
      assignedTo: newTask.assignedTo,
      due: newTask.dueDate,
      dueDate: newTask.dueDate,
      priority: newTask.priority,
      status: "TODO"
    };

    if (editingTask) {
      const editId = editingTask.id;
      setTasks((prev) =>
        prev.map((t) => (String(t.id) === String(editId) ? { ...t, ...payload } : t))
      );
      setShowForm(false);
      setEditingTask(null);

      try {
        await updateTask(editId, payload);
      } catch (err) {
        console.warn("[Calendar] Update Task API error:", err.message);
      }
      return;
    }

    const tempId = `TSK-${Date.now()}`;
    const optimisticTask = {
      id: tempId,
      ...payload,
      completed: false
    };

    setTasks((previousTasks) => [optimisticTask, ...previousTasks]);
    setShowForm(false);

    try {
      const saved = await createTask(payload);
      if (saved?.id) {
        setTasks((prev) =>
          prev.map((t) => (t.id === tempId ? { ...t, ...saved } : t))
        );
      }
    } catch (err) {
      console.warn("[Calendar] Create Task API error:", err.message);
    }
  }


  const isSelectedEventOverdue = () => {
    if (!selectedEvent || selectedEvent.completed) return false;
    const dueTime = new Date(selectedEvent.date).setHours(0, 0, 0, 0);
    const todayTime = new Date().setHours(0, 0, 0, 0);
    return dueTime < todayTime;
  };

  return (
    <div className="crm-calendar">
      <div className="crm-calendar-header">
        <div>
          <h1>Calendar </h1>
          <p>Events, deadlines, and task milestones</p>
        </div>

        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>

          <button
            type="button"
            className="calendar-primary-btn"
            onClick={openAddTask}
          >
            <Plus size={18} />
            Add Event
          </button>
        </div>
      </div>

      <div className="calendar-stats">
        <div className="calendar-stat-card">
          <CalendarDays size={24} style={{ color: "#2563eb" }} />
          <div>
            <span>Total Events</span>
            <h2>{totalEvents}</h2>
          </div>
        </div>

        <div className="calendar-stat-card">
          <Clock size={24} style={{ color: "#f59e0b" }} />
          <div>
            <span>Pending</span>
            <h2>{pendingCount}</h2>
          </div>
        </div>

        <div className="calendar-stat-card">
          <CheckCircle2 size={24} style={{ color: "#10b981" }} />
          <div>
            <span>Completed</span>
            <h2>{completedCount}</h2>
          </div>
        </div>
      </div>

      <div className="calendar-mix">

        <div className="calendar-layout">
          <FullCalendar
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            selectable={true}
            events={calendarEvents}
            eventClick={handleEventClick}
            headerToolbar={{
              left: "prev,next today",
              center: "title",
              right: "dayGridMonth,timeGridWeek,timeGridDay"
            }}

            height="auto"
          />
        </div>

        <aside className="calendar-agenda" aria-label="Upcoming agenda">
          <div className="calendar-agenda-heading">
            <div><CalendarDays size={17} /><h2>Upcoming Events</h2></div>
            <span>{agendaEvents.length}</span>
          </div>
          {agendaEvents.length ? (
            <div className="calendar-agenda-list">
              {agendaEvents.map((event) => {
                const starts = new Date(event.start);
                const p = event.extendedProps;

                const rawTask = tasks.find((t) => String(t.id) === String(event.id));
                const assignedName = resolveOwnerName(event.extendedProps?.assignedTo || rawTask?.assignedTo, event.title);
                return (
                  <button
                    type="button"
                    className="calendar-agenda-item"
                    key={event.id}
                    onClick={() => setSelectedEventId(event.id)}
                  >
                    <div className="calendar-agenda-header-row">
                      <span className="calendar-agenda-date">{displayDate(starts)}</span>
                      {p?.priority && (
                        <span className={`calendar-agenda-prio prio-${(p.priority || "medium").toLowerCase()}`}>
                          {p.priority}
                        </span>
                      )}
                    </div>
                    <strong className="calendar-agenda-title">{event.title}</strong>
                    {assignedName && (
                      <span className="calendar-agenda-subtitle">
                        {assignedName}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ) : <p className="calendar-empty">No events in this date range.</p>}
        </aside>
      </div>

      {selectedEvent && (
        <div className="sales-calendar-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelectedEventId(null); }}>
          <section className="sales-calendar-dialog sales-calendar-details" role="dialog" aria-modal="true" aria-labelledby="sales-calendar-detail-title">
            <div className="sales-calendar-dialog-heading"><div><span className={`sales-calendar-type-badge type-${selectedEvent.type.toLowerCase().replace("-", "")}`}>{selectedEvent.type}</span><h2 id="sales-calendar-detail-title">{selectedEvent.title}</h2></div><button className="sales-calendar-icon-button" type="button" aria-label="Close" onClick={() => setSelectedEventId(null)}><X size={19} /></button></div>
            <div className="sales-calendar-detail-line"><Clock3 size={17} /><span>{displayDate(new Date(selectedEvent.start))}{selectedEvent.start.includes("T") ? `, ${displayTime(new Date(selectedEvent.start))}${selectedEvent.end ? ` – ${displayTime(new Date(selectedEvent.end))}` : ""}` : " · All day"}</span></div>
            {selectedEvent.relatedTo && <div className="sales-calendar-detail-block"><span>Related to</span><strong>{relatedNames[selectedEvent.relatedTo] || "Record unavailable"}</strong></div>}
            {/* <div className="sales-calendar-detail-block"><span>Notes</span><p>{selectedEvent.notes || "No notes added."}</p></div> */}
            <div className="sales-calendar-detail-block"><span>Assigned To</span><p>{resolveOwnerName(selectedEvent.extendedProps?.assignedTo, selectedEvent.title)}</p></div>

            <div className="sales-calendar-dialog-actions sales-calendar-detail-actions"><button type="button" className="sales-calendar-delete-button" onClick={() => setDeleteConfirmation(true)}><Trash2 size={16} /> Delete</button><button type="button" className="sales-calendar-secondary-button" onClick={openEditEvent}><Pencil size={15} /> Edit event</button></div>
          </section>
        </div>
      )}

      {deleteConfirmation && selectedEvent && <ConfirmDialog title="Delete this event?" message={`“${selectedEvent.title}” will be removed from your calendar.`} onCancel={() => setDeleteConfirmation(false)} onConfirm={deleteEvent} confirmLabel="Delete event" />}

      {showForm && (
        <div className="calendar-modal-overlay" onClick={() => setShowForm(false)}>
          <div
            className="calendar-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="calendar-form-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="calendar-modal-header">
              <div>
                <h2 id="calendar-form-title">{editingTask ? "Edit Event" : "Add New Event"}</h2>
                <p>{editingTask ? "Update event details and schedule" : "Create an event and schedule it to database"}</p>
              </div>

              <button
                type="button"
                className="calendar-close-btn"
                aria-label="Close form"
                onClick={() => setShowForm(false)}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveTask}>
              <div className="calendar-form-group">
                <label htmlFor="task-title">Event Title *</label>
                <input
                  id="task-title"
                  type="text"
                  placeholder="e.g. Follow up with client regarding proposal"
                  value={newTask.title}
                  onChange={(e) =>
                    setNewTask({
                      ...newTask,
                      title: e.target.value
                    })
                  }
                  required
                  autoFocus
                />
              </div>

              <div className="calendar-form-group">
                <label htmlFor="task-client">Client / Organization</label>
                <input
                  id="task-client"
                  type="text"
                  placeholder="e.g. Apex Global Systems"
                  value={newTask.client}
                  onChange={(e) =>
                    setNewTask({
                      ...newTask,
                      client: e.target.value
                    })
                  }
                />
              </div>

              <div className="calendar-form-group">
                <label htmlFor="task-assigned">Assigned Owner</label>
                <input
                  id="task-assigned"
                  type="text"
                  placeholder="e.g. Sarah Jenkins"
                  value={newTask.assignedTo}
                  onChange={(e) =>
                    setNewTask({
                      ...newTask,
                      assignedTo: e.target.value
                    })
                  }
                />
              </div>

              <div className="calendar-form-group">
                <label htmlFor="task-date">Due Date *</label>
                <input
                  id="task-date"
                  type="date"
                  value={newTask.dueDate}
                  onChange={(e) =>
                    setNewTask({
                      ...newTask,
                      dueDate: e.target.value
                    })
                  }
                  required
                />
              </div>

              <div className="calendar-form-group">
                <label htmlFor="task-priority">Priority</label>
                <select
                  id="task-priority"
                  value={newTask.priority}
                  onChange={(e) =>
                    setNewTask({
                      ...newTask,
                      priority: e.target.value
                    })
                  }
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </div>

              <div className="calendar-form-actions">
                <button
                  type="button"
                  className="calendar-secondary-btn"
                  onClick={() => setShowForm(false)}
                >
                  Cancel
                </button>

                <button type="submit" className="calendar-primary-btn">
                  {editingTask ? "Update Event" : "Save to Calendar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

function ConfirmDialog({ title, message, onCancel, onConfirm, confirmLabel = "Delete event" }) {
  return (
    <div
      className="sales-calendar-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onCancel();
      }}
    >
      <div
        className="sales-calendar-dialog sales-calendar-confirm-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="sales-calendar-confirm-title"
      >
        <div className="sales-calendar-dialog-heading">
          <h2 id="sales-calendar-confirm-title">{title}</h2>
          <button
            className="sales-calendar-icon-button"
            type="button"
            aria-label="Close"
            onClick={onCancel}
          >
            <X size={19} />
          </button>
        </div>
        <p className="sales-calendar-confirm-msg">{message}</p>
        <div className="sales-calendar-dialog-actions">
          <button
            type="button"
            className="sales-calendar-secondary-button"
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            type="button"
            className="sales-calendar-delete-button"
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

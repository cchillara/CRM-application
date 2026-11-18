import { useEffect, useMemo, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { AlertCircle, CalendarDays, Check, CheckCircle2, Clock3, Pencil, Plus, Trash2, X } from "lucide-react";
import { createTask, deleteTask, getTasks, updateTask } from "../api/userPortalApi.js";
import "../../client-admin-portal/styles/Calendar.css";

const formatDate = (value) => {
  const parsed = value ? new Date(value) : new Date();
  const date = Number.isNaN(parsed.getTime()) ? new Date() : parsed;
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
};

export default function CalendarPage() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedTask, setSelectedTask] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ title: "", dueDate: formatDate(), time: "09:00", priority: "MEDIUM" });
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    let active = true;
    getTasks().then((result) => { if (active) { const rows = Array.isArray(result) ? result : result?.items || []; setTasks(rows.map((task) => ({ ...task }))); } })
      .catch((requestError) => { if (active) { setTasks([]); setError(requestError.message || "Could not load your tasks."); } })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const events = useMemo(() => tasks.map((task) => ({
    id: String(task.id),
    title: task.title,
    start: task.time ? `${formatDate(task.dueDate || task.due)}T${task.time}` : formatDate(task.dueDate || task.due),
    allDay: !task.time,
    classNames: [`calendar-priority-${String(task.priority || "medium").toLowerCase()}`, task.completed ? "calendar-event-completed" : ""],
    extendedProps: { task },
  })), [tasks]);

  const completedCount = tasks.filter((task) => task.completed || task.status === "COMPLETED").length;
  const openCount = tasks.length - completedCount;

  function openNewTask(date) {
    setEditingId(null);
    setForm({ title: "", dueDate: date ? formatDate(date) : formatDate(), time: "09:00", priority: "MEDIUM" });
    setError("");
    setFormOpen(true);
  }

  function openEditTask(task) {
    setEditingId(String(task.id));
    setSelectedTask(null);
    setForm({ title: task.title || "", dueDate: formatDate(task.dueDate || task.due), time: task.time || "09:00", priority: String(task.priority || "MEDIUM").toUpperCase() });
    setError("");
    setFormOpen(true);
  }

  async function saveTask(event) {
    event.preventDefault();
    setSaving(true); setError("");
    const payload = { title: form.title.trim(), dueDate: form.dueDate, time: form.time || "", priority: form.priority, ...(editingId ? {} : { status: "TODO" }) };
    try {
      if (editingId) {
        const updated = await updateTask(editingId, payload);
        setTasks((current) => current.map((task) => String(task.id) === editingId ? { ...task, ...updated, ...payload } : task));
      } else {
        const created = await createTask(payload);
        setTasks((current) => [{ ...created, ...payload, id: String(created.id) }, ...current]);
      }
      setFormOpen(false); setEditingId(null);
    } catch (requestError) {
      setError(requestError.message || "Could not save this calendar task.");
    } finally { setSaving(false); }
  }

  async function removeTask() {
    if (!selectedTask) return;
    const task = selectedTask;
    setTasks((current) => current.filter((item) => String(item.id) !== String(task.id)));
    setSelectedTask(null);
    try { await deleteTask(task.id); }
    catch (requestError) { setTasks((current) => [task, ...current]); setError(requestError.message || "Could not delete this task."); }
  }

  async function moveTask(info) {
    const task = tasks.find((item) => String(item.id) === String(info.event.id));
    if (!task) return;
    const dueDate = formatDate(info.event.start);
    setTasks((current) => current.map((item) => String(item.id) === String(task.id) ? { ...item, dueDate } : item));
    try { await updateTask(task.id, { dueDate }); }
    catch (requestError) { info.revert(); setTasks((current) => current.map((item) => String(item.id) === String(task.id) ? task : item)); setError(requestError.message || "Could not reschedule this task."); }
  }

  async function toggleTaskComplete(task) {
    const wasComplete = task.completed || task.status === "COMPLETED";
    const update = { status: wasComplete ? "TODO" : "COMPLETED", completed: !wasComplete };
    setTasks((current) => current.map((item) => String(item.id) === String(task.id) ? { ...item, ...update } : item));
    setSelectedTask((current) => current && String(current.id) === String(task.id) ? { ...current, ...update } : current);
    try {
      const saved = await updateTask(task.id, update);
      setTasks((current) => current.map((item) => String(item.id) === String(task.id) ? { ...item, ...saved } : item));
      setSelectedTask((current) => current && String(current.id) === String(task.id) ? { ...current, ...saved } : current);
    } catch (requestError) {
      setTasks((current) => current.map((item) => String(item.id) === String(task.id) ? task : item));
      setSelectedTask(task);
      setError(requestError.message || "Could not update this task.");
    }
  }

  return <div className="crm-calendar user-crm-calendar">
    <div className="crm-calendar-header">
      <div><h1>My Calendar</h1><p>Plan and update your assigned tasks and follow-ups.</p></div>
      <button type="button" className="calendar-primary-btn" onClick={() => openNewTask()}><Plus size={17} /> Add task</button>
    </div>
    {error && <div className="calendar-user-error" role="alert"><AlertCircle size={17} />{error}<button type="button" onClick={() => setError("")} aria-label="Dismiss error"><X size={16} /></button></div>}
    <section className="calendar-stats">
      <article className="calendar-stat-card"><CalendarDays size={22} /><div><span>Total tasks</span><h2>{loading ? "—" : tasks.length}</h2></div></article>
      <article className="calendar-stat-card"><Clock3 size={22} /><div><span>Open tasks</span><h2>{loading ? "—" : openCount}</h2></div></article>
      <article className="calendar-stat-card"><CheckCircle2 size={22} /><div><span>Completed</span><h2>{loading ? "—" : completedCount}</h2></div></article>
    </section>
    <div className="calendar-mix user-calendar-mix">
        <div className="calendar-layout user-calendar-grid"><FullCalendar plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]} initialView="dayGridMonth" headerToolbar={{ left: "prev,next today", center: "title", right: "dayGridMonth,timeGridWeek,timeGridDay" }} events={events} editable selectable height="auto" dayMaxEvents eventClick={({ event }) => setSelectedTask(event.extendedProps.task)} dateClick={({ date }) => openNewTask(date)} eventDrop={moveTask} eventTimeFormat={{ hour: "numeric", minute: "2-digit", meridiem: "short" }} /></div>
        <aside className="calendar-agenda user-calendar-agenda"><div className="calendar-agenda-heading"><div><CalendarDays size={19} /><h2>Upcoming tasks</h2></div><span>{openCount}</span></div>
          {tasks.filter((task) => !(task.completed || task.status === "COMPLETED")).sort((a, b) => new Date(a.dueDate || a.due) - new Date(b.dueDate || b.due)).slice(0, 8).map((task) => <button type="button" className="calendar-agenda-item user-agenda-item" key={task.id} onClick={() => setSelectedTask(task)}><span className={`calendar-agenda-prio prio-${String(task.priority || "medium").toLowerCase()}`}>{task.priority || "Medium"}</span><strong className="calendar-agenda-title">{task.title}</strong><span className="calendar-agenda-subtitle">{new Date(task.dueDate || task.due).toLocaleString(undefined, { month: "short", day: "numeric", ...(task.time ? { hour: "numeric", minute: "2-digit" } : {}) })}</span></button>)}
          {!loading && openCount === 0 && <p className="calendar-empty-agenda">No upcoming tasks. Add one to your calendar.</p>}
        </aside>
    </div>

    {selectedTask && <div className="calendar-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelectedTask(null); }}><section className="calendar-event-modal-card" role="dialog" aria-modal="true" aria-labelledby="user-event-title"><div className="calendar-event-modal-top"><div><h2 className="calendar-event-title-text" id="user-event-title">{selectedTask.title}</h2><span className={`calendar-type-badge type-${String(selectedTask.priority || "task").toLowerCase()}`}>{selectedTask.priority || "Task"}</span></div><button type="button" className="calendar-icon-button" onClick={() => setSelectedTask(null)} aria-label="Close"><X size={19} /></button></div><div className="calendar-event-modal-body"><div className="calendar-detail-block"><span>Due date</span><strong>{new Date(selectedTask.dueDate || selectedTask.due).toLocaleString(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric", ...(selectedTask.time ? { hour: "numeric", minute: "2-digit" } : {}) })}</strong></div><div className="calendar-detail-block"><span>Status</span><strong>{selectedTask.completed || selectedTask.status === "COMPLETED" ? "Completed" : "Open"}</strong></div></div><div className="calendar-dialog-actions"><button type="button" className="calendar-delete-button" onClick={removeTask}><Trash2 size={16} /> Delete task</button><button type="button" className="calendar-secondary-button" onClick={() => openEditTask(selectedTask)}><Pencil size={15} /> Edit task</button><button type="button" className="calendar-primary-btn" onClick={() => toggleTaskComplete(selectedTask)}><Check size={15} /> {selectedTask.completed || selectedTask.status === "COMPLETED" ? "Mark pending" : "Mark complete"}</button></div></section></div>}

    {formOpen && <div className="calendar-modal-overlay" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setFormOpen(false); }}><section className="calendar-modal" role="dialog" aria-modal="true" aria-labelledby="user-calendar-form-title"><div className="calendar-modal-header"><div><h2 id="user-calendar-form-title">{editingId ? "Edit task" : "Add calendar task"}</h2><p>Keep your follow-ups organized.</p></div><button type="button" className="calendar-close-btn" aria-label="Close" onClick={() => setFormOpen(false)}><X size={20} /></button></div><form onSubmit={saveTask}><div className="calendar-form-group"><label htmlFor="user-calendar-title">Task title *</label><input id="user-calendar-title" autoFocus required value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} placeholder="Follow up with a customer" /></div><div className="calendar-form-group"><label htmlFor="user-calendar-date">Due date *</label><input id="user-calendar-date" type="date" required value={form.dueDate} onChange={(event) => setForm((current) => ({ ...current, dueDate: event.target.value }))} /></div><div className="calendar-form-group"><label htmlFor="user-calendar-time">Time</label><input id="user-calendar-time" type="time" value={form.time} onChange={(event) => setForm((current) => ({ ...current, time: event.target.value }))} /></div><div className="calendar-form-group"><label htmlFor="user-calendar-priority">Priority</label><select id="user-calendar-priority" value={form.priority} onChange={(event) => setForm((current) => ({ ...current, priority: event.target.value }))}><option value="LOW">Low</option><option value="MEDIUM">Medium</option><option value="HIGH">High</option></select></div>{error && <p role="alert" className="calendar-form-error">{error}</p>}<div className="calendar-form-actions"><button type="button" className="calendar-secondary-btn" onClick={() => setFormOpen(false)}>Cancel</button><button type="submit" className="calendar-primary-btn" disabled={saving}>{saving ? "Saving…" : editingId ? "Save changes" : "Add task"}</button></div></form></section></div>}
  </div>;
}

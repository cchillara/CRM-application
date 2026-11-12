import { useEffect, useMemo, useState } from "react";
import { CalendarDays, Check, ChevronLeft, ChevronRight, Clock3, Plus, Trash2, X } from "lucide-react";
import { createTask, deleteTask, getTasks, updateTask } from "../../../src/client-admin-portal/Api/Tasks";

function dateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function initialEvents() {
  try {
    const saved = JSON.parse(localStorage.getItem("shnoorCalendarEvents") || "null");
    if (Array.isArray(saved)) return saved;
  } catch { /* use demo events */ }
  const today = new Date();
  const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
  const later = new Date(today); later.setDate(today.getDate() + 3);
  return [
    { id: "sample-1", title: "Follow up with Acme Corporation", date: dateKey(today), time: "10:30", priority: "High", completed: false },
    { id: "sample-2", title: "Product discovery call", date: dateKey(tomorrow), time: "14:00", priority: "Medium", completed: false },
    { id: "sample-3", title: "Send proposal to Northwind", date: dateKey(later), time: "09:00", priority: "Low", completed: true }
  ];
}

export default function CalendarPage() {
  const [events, setEvents] = useState(initialEvents);
  useEffect(() => {
    let active = true;
    getTasks().then((tasks) => {
      if (!active || !Array.isArray(tasks) || tasks.length === 0) return;
      const mapped = tasks.map((task) => {
        const due = task.due || task.dueDate || task.start || dateKey(new Date());
        const date = String(due).includes("T") ? String(due).slice(0, 10) : String(due);
        return {
          id: String(task.id), title: task.title || "Untitled task", date,
          time: task.time || (String(due).includes("T") ? String(due).slice(11, 16) : "09:00"),
          priority: task.priority || "Medium",
          completed: task.completed === true || task.status === "COMPLETED"
        };
      });
      setEvents(mapped);
      localStorage.setItem("shnoorCalendarEvents", JSON.stringify(mapped));
    }).catch(() => {});
    return () => { active = false; };
  }, []);
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState(() => dateKey(new Date()));
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState({ title: "", date: dateKey(new Date()), time: "09:00", priority: "Medium" });
  const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const offset = monthStart.getDay();
  const cells = Array.from({ length: Math.ceil((offset + daysInMonth) / 7) * 7 }, (_, index) => {
    const day = index - offset + 1;
    return day > 0 && day <= daysInMonth ? new Date(currentDate.getFullYear(), currentDate.getMonth(), day) : null;
  });
  const monthEvents = useMemo(() => events.filter((event) => event.date.startsWith(`${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}`)), [events, currentDate]);
  const selectedEvents = events.filter((event) => event.date === selectedDate).sort((a, b) => a.time.localeCompare(b.time));
  const pending = events.filter((event) => !event.completed).length;
  const completed = events.filter((event) => event.completed).length;

  function updateEvents(next) {
    setEvents(next);
    localStorage.setItem("shnoorCalendarEvents", JSON.stringify(next));
  }
  function changeMonth(amount) { setCurrentDate((date) => new Date(date.getFullYear(), date.getMonth() + amount, 1)); }
  function addEvent(event) {
    event.preventDefault();
    if (!form.title.trim() || !form.date) return;
    const temporaryId = `event-${Date.now()}`;
    const added = { ...form, id: temporaryId, title: form.title.trim(), completed: false };
    updateEvents([...events, added]);
    createTask({ title: added.title, due: added.date, dueDate: added.date, priority: added.priority, status: "TODO" })
      .then((saved) => {
        if (saved?.id) setEvents((current) => {
          const next = current.map((item) => item.id === temporaryId ? { ...item, id: String(saved.id) } : item);
          localStorage.setItem("shnoorCalendarEvents", JSON.stringify(next));
          return next;
        });
      }).catch(() => {});
    setSelectedDate(form.date);
    setFormOpen(false);
    setForm({ title: "", date: selectedDate, time: "09:00", priority: "Medium" });
  }
  function toggleEvent(id) {
    const target = events.find((event) => event.id === id);
    if (!target) return;
    const completed = !target.completed;
    updateEvents(events.map((event) => event.id === id ? { ...event, completed } : event));
    if (!String(id).startsWith("sample-") && !String(id).startsWith("event-")) {
      updateTask(id, { completed, status: completed ? "COMPLETED" : "TODO" }).catch(() => {});
    }
  }
  function removeEvent(id) {
    updateEvents(events.filter((event) => event.id !== id));
    if (!String(id).startsWith("sample-") && !String(id).startsWith("event-")) deleteTask(id).catch(() => {});
  }

  return <div className="calendar-page">
    <section className="calendar-summary-grid">
      <CalendarStat label="Total events" value={events.length} caption="Across your calendar" tone="blue" />
      <CalendarStat label="Upcoming" value={pending} caption="Need your attention" tone="orange" />
      <CalendarStat label="Completed" value={completed} caption="Tasks finished" tone="green" />
    </section>
    <section className="calendar-layout">
      <article className="panel month-panel">
        <div className="calendar-toolbar"><div><h2>{currentDate.toLocaleDateString(undefined, { month: "long", year: "numeric" })}</h2><p>Plan your meetings and follow-ups.</p></div><div className="calendar-controls"><button aria-label="Previous month" onClick={() => changeMonth(-1)}><ChevronLeft size={17} /></button><button className="today-button" onClick={() => { const today = new Date(); setCurrentDate(today); setSelectedDate(dateKey(today)); }}>Today</button><button aria-label="Next month" onClick={() => changeMonth(1)}><ChevronRight size={17} /></button></div></div>
        <div className="month-grid">{["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => <div className="weekday" key={day}>{day}</div>)}{cells.map((date, index) => {
          const key = date && dateKey(date);
          const dayEvents = key ? monthEvents.filter((event) => event.date === key) : [];
          return <button type="button" className={`calendar-day ${!date ? "outside" : ""} ${key === selectedDate ? "selected" : ""} ${key === dateKey(new Date()) ? "today" : ""}`} key={`${key || "blank"}-${index}`} disabled={!date} onClick={() => setSelectedDate(key)}>
            {date && <><span className="day-number">{date.getDate()}</span><span className="day-event-list">{dayEvents.slice(0, 2).map((event) => <span className={`day-event ${event.completed ? "done" : ""}`} key={event.id}>{event.title}</span>)}{dayEvents.length > 2 && <span className="more-events">+{dayEvents.length - 2} more</span>}</span></>}
          </button>;
        })}</div>
      </article>
      <aside className="panel agenda-panel"><div className="agenda-heading"><div><span className="eyebrow">DAILY AGENDA</span><h2>{new Date(`${selectedDate}T12:00:00`).toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" })}</h2></div><button className="primary-button add-event-button" onClick={() => { setForm({ title: "", date: selectedDate, time: "09:00", priority: "Medium" }); setFormOpen(true); }}><Plus size={15} /> Add event</button></div>
        <div className="agenda-list">{selectedEvents.length === 0 ? <div className="agenda-empty"><CalendarDays size={25} /><strong>No events for this day</strong><span>Add a task or follow-up to your calendar.</span></div> : selectedEvents.map((event) => <div className={`agenda-event ${event.completed ? "completed" : ""}`} key={event.id}><button className={`event-check ${event.completed ? "checked" : ""}`} aria-label={event.completed ? "Mark as pending" : "Mark as complete"} onClick={() => toggleEvent(event.id)}>{event.completed && <Check size={13} />}</button><div className="agenda-event-copy"><strong>{event.title}</strong><span><Clock3 size={13} /> {event.time}</span><small className={`priority priority-${event.priority.toLowerCase()}`}>{event.priority}</small></div><button className="event-delete" aria-label={`Delete ${event.title}`} onClick={() => removeEvent(event.id)}><Trash2 size={15} /></button></div>)}</div>
      </aside>
    </section>
    {formOpen && <div className="modal-backdrop" onClick={() => setFormOpen(false)}><section className="account-modal event-modal" role="dialog" aria-modal="true" aria-labelledby="event-title" onClick={(event) => event.stopPropagation()}><div className="modal-heading"><span className="empty-icon"><CalendarDays size={21} /></span><div><span className="eyebrow">CALENDAR</span><h2 id="event-title">Add an event</h2></div><button className="modal-close" onClick={() => setFormOpen(false)} aria-label="Close"><X size={18} /></button></div><form onSubmit={addEvent}><label>Event title<input autoFocus required value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="Add a follow-up or meeting" /></label><div className="event-form-grid"><label>Date<input required type="date" value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} /></label><label>Time<input type="time" value={form.time} onChange={(event) => setForm({ ...form, time: event.target.value })} /></label></div><label>Priority<select value={form.priority} onChange={(event) => setForm({ ...form, priority: event.target.value })}><option>Low</option><option>Medium</option><option>High</option></select></label><div className="modal-actions"><button type="button" className="secondary-button" onClick={() => setFormOpen(false)}>Cancel</button><button className="primary-button"><Plus size={15} /> Add event</button></div></form></section></div>}
  </div>;
}

function CalendarStat({ label, value, caption, tone }) {
  return <article className="stat-card calendar-stat"><div className="stat-top"><span>{label}</span><span className={`stat-icon tone-${tone}`}><CalendarDays size={17} /></span></div><strong className="stat-value">{value}</strong><div className="stat-foot">{caption}</div></article>;
}

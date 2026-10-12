import { useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import listPlugin from "@fullcalendar/list";
import interactionPlugin from "@fullcalendar/interaction";
import { CalendarDays, ChevronLeft, ChevronRight, Clock3, Pencil, Plus, Trash2, X } from "lucide-react";
import { getLeadContactName, useSalesData } from "../../components/sales/SalesDataContext.jsx";
import { salesCalendarEvents } from "../../data/salesCalendarData.js";
import "./SalesCalendar.css";

const eventTypes = ["Call", "Meeting", "Follow-up", "Task"];
const plugins = [dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin];
const emptyForm = { title: "", type: "Call", date: "", startTime: "", endTime: "", relatedTo: "", notes: "" };

function dateInputValue(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function timeInputValue(date) {
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

function eventFormFromCalendarEvent(event) {
  const start = new Date(event.start);
  const end = event.end ? new Date(event.end) : null;
  const allDay = !event.start.includes("T");
  return {
    title: event.title,
    type: event.type,
    date: dateInputValue(start),
    startTime: allDay ? "" : timeInputValue(start),
    endTime: end && !allDay ? timeInputValue(end) : "",
    relatedTo: event.relatedTo || "",
    notes: event.notes || "",
  };
}

function displayDate(date) {
  return new Intl.DateTimeFormat("en-US", { weekday: "short", month: "short", day: "numeric" }).format(date);
}

function displayTime(date) {
  return new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" }).format(date);
}

function SalesCalendar() {
  const { leads, customers } = useSalesData();
  const [events, setEvents] = useState(salesCalendarEvents);
  const [visibleTypes, setVisibleTypes] = useState(eventTypes);
  const [dateRange, setDateRange] = useState({ start: new Date("2026-10-05T00:00:00"), end: new Date("2026-10-12T00:00:00") });
  const [calendarApi, setCalendarApi] = useState(null);
  const [rangeTitle, setRangeTitle] = useState("October 5 – 11, 2026");
  const [selectedEventId, setSelectedEventId] = useState(null);
  const [form, setForm] = useState(null);
  const [formError, setFormError] = useState("");
  const [deleteConfirmation, setDeleteConfirmation] = useState(false);

  const relatedChoices = [
    ...leads.map((lead) => ({ id: lead.id, kind: "Lead", name: getLeadContactName(lead), company: lead.company?.name })),
    ...customers.map((customer) => ({ id: customer.id, kind: "Customer", name: customer.name, company: customer.company })),
  ];
  const relatedNames = Object.fromEntries(relatedChoices.map((choice) => [choice.id, `${choice.name}${choice.company ? ` · ${choice.company}` : ""}`]));
  const visibleEvents = events.filter((event) => visibleTypes.includes(event.type));
  const agendaEvents = visibleEvents
    .filter((event) => {
      const eventStart = new Date(`${event.start.slice(0, 10)}T00:00:00`);
      return eventStart >= dateRange.start && eventStart < dateRange.end;
    })
    .sort((first, second) => first.start.localeCompare(second.start));
  const selectedEvent = events.find((event) => event.id === selectedEventId);

  const toggleType = (type) => {
    setVisibleTypes((current) => current.includes(type) ? current.filter((item) => item !== type) : [...current, type]);
  };

  const openNewEvent = (date, endDate) => {
    const start = date || new Date();
    setForm({
      mode: "create",
      eventId: null,
      values: {
        ...emptyForm,
        date: dateInputValue(start),
        startTime: date && !endDate ? "" : timeInputValue(start),
        endTime: endDate ? timeInputValue(endDate) : "",
      },
    });
    setFormError("");
    setSelectedEventId(null);
  };

  const openEditEvent = () => {
    if (!selectedEvent) return;
    setForm({ mode: "edit", eventId: selectedEvent.id, values: eventFormFromCalendarEvent(selectedEvent) });
    setFormError("");
    setSelectedEventId(null);
  };

  const saveEvent = (submitEvent) => {
    submitEvent.preventDefault();
    const { title, type, date, startTime, endTime, relatedTo, notes } = form.values;
    if (!title.trim() || !type || !date) {
      setFormError("Add a title, event type, and date.");
      return;
    }
    if (["Call", "Meeting"].includes(type) && (!startTime || !endTime)) {
      setFormError("Calls and meetings need a start and end time.");
      return;
    }
    if (startTime && endTime && endTime <= startTime) {
      setFormError("End time must be later than start time.");
      return;
    }

    const startsAt = startTime ? `${date}T${startTime}:00` : date;
    const endsAt = endTime ? `${date}T${endTime}:00` : null;
    const nextEvent = { id: form.eventId || `calendar-${Date.now()}`, title: title.trim(), type, start: startsAt, end: endsAt, relatedTo, notes: notes.trim() };
    setEvents((current) => form.mode === "edit"
      ? current.map((event) => event.id === form.eventId ? nextEvent : event)
      : [...current, nextEvent]);
    setVisibleTypes((current) => current.includes(type) ? current : [...current, type]);
    setForm(null);
    setFormError("");
  };

  const deleteEvent = () => {
    if (!selectedEvent) return;
    setEvents((current) => current.filter((event) => event.id !== selectedEvent.id));
    setSelectedEventId(null);
    setDeleteConfirmation(false);
  };

  const goToToday = () => calendarApi?.today();
  const changeRange = (direction) => calendarApi?.[direction]();

  return (
    <div className="sales-calendar-page">
      <header className="sales-calendar-header">
        <div>
          <h1>Calendar</h1>
          <p>Keep track of your calls, meetings, and follow-ups.</p>
        </div>
        <button className="sales-calendar-primary-button" type="button" onClick={() => openNewEvent(new Date())}>
          <Plus size={17} /> Add Event
        </button>
      </header>

      <div className="sales-calendar-filters" aria-label="Filter calendar events">
        <span className="sales-calendar-filter-label">Show</span>
        {eventTypes.map((type) => (
          <label className={`sales-calendar-filter ${visibleTypes.includes(type) ? "selected" : ""}`} key={type}>
            <input type="checkbox" checked={visibleTypes.includes(type)} onChange={() => toggleType(type)} />
            <span className={`sales-calendar-dot type-${type.toLowerCase().replace("-", "")}`} />
            {type}
          </label>
        ))}
      </div>

      <div className="sales-calendar-layout">
        <section className="sales-calendar-card" aria-label="Calendar">
          <div className="sales-calendar-toolbar">
            <div className="sales-calendar-navigation">
              <button type="button" aria-label="Previous date range" onClick={() => changeRange("prev")}><ChevronLeft size={18} /></button>
              <button type="button" aria-label="Next date range" onClick={() => changeRange("next")}><ChevronRight size={18} /></button>
              <button className="sales-calendar-today" type="button" onClick={goToToday}>Today</button>
              <h2>{rangeTitle}</h2>
            </div>
            <div className="sales-calendar-views" aria-label="Calendar view">
              {[{ label: "Week", view: "timeGridWeek" }, { label: "Month", view: "dayGridMonth" }, { label: "Day", view: "timeGridDay" }, { label: "List", view: "listWeek" }].map(({ label, view }) => (
                <button key={view} className={calendarApi?.view.type === view ? "active" : ""} type="button" onClick={() => calendarApi?.changeView(view)}>{label}</button>
              ))}
            </div>
          </div>
          <div className="sales-calendar-grid">
            <FullCalendar
              plugins={plugins} initialView="timeGridWeek" initialDate="2026-10-09" headerToolbar={false} height="auto" allDaySlot
              nowIndicator
              selectable
              selectMirror
              dayMaxEvents
              events={visibleEvents.map((event) => ({ ...event, classNames: [`calendar-event-${event.type.toLowerCase().replace("-", "")}`] }))}
              eventClick={({ event }) => setSelectedEventId(event.id)}
              select={({ start, end, allDay }) => {
                openNewEvent(start, allDay ? null : end);
                calendarApi?.unselect();
              }}
              datesSet={({ view, start, end }) => {
                setCalendarApi(view.calendar);
                setDateRange({ start, end });
                setRangeTitle(view.title);
              }}
              eventTimeFormat={{ hour: "numeric", minute: "2-digit", meridiem: "short" }}
              slotMinTime="07:00:00"
              slotMaxTime="20:00:00"
              expandRows
            />
          </div>
        </section>

        <aside className="sales-calendar-agenda" aria-label="Upcoming agenda">
          <div className="sales-calendar-agenda-heading">
            <div><CalendarDays size={17} /><h2>Upcoming</h2></div>
            <span>{agendaEvents.length}</span>
          </div>
          <p className="sales-calendar-agenda-range">{rangeTitle}</p>
          {agendaEvents.length ? (
            <div className="sales-calendar-agenda-list">
              {agendaEvents.map((event) => {
                const starts = new Date(event.start);
                return (
                  <button type="button" className="sales-calendar-agenda-item" key={event.id} onClick={() => setSelectedEventId(event.id)}>
                    <span className={`sales-calendar-agenda-marker type-${event.type.toLowerCase().replace("-", "")}`} />
                    <span className="sales-calendar-agenda-copy">
                      <span className="sales-calendar-agenda-date">{displayDate(starts)}{!event.end && !event.start.includes("T") ? " · All day" : ` · ${displayTime(starts)}`}</span>
                      <strong>{event.title}</strong>
                      <span className="sales-calendar-agenda-meta">{event.type}{event.relatedTo && relatedNames[event.relatedTo] ? ` · ${relatedNames[event.relatedTo].split(" · ")[0]}` : ""}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          ) : <p className="sales-calendar-empty">No events in this date range.</p>}
        </aside>
      </div>

      {form && (
        <div className="sales-calendar-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setForm(null); }}>
          <section className="sales-calendar-dialog" role="dialog" aria-modal="true" aria-labelledby="sales-calendar-form-title">
            <div className="sales-calendar-dialog-heading">
              <div><h2 id="sales-calendar-form-title">{form.mode === "edit" ? "Edit event" : "Add event"}</h2><p>Enter the details for this calendar event.</p></div>
              <button className="sales-calendar-icon-button" type="button" aria-label="Close" onClick={() => setForm(null)}><X size={19} /></button>
            </div>
            <form onSubmit={saveEvent}>
              <label className="sales-calendar-field sales-calendar-field-full">Title <span>*</span>
                <input autoFocus required value={form.values.title} onChange={(event) => setForm({ ...form, values: { ...form.values, title: event.target.value } })} placeholder="e.g. Product walkthrough" />
              </label>
              <div className="sales-calendar-form-row">
                <label className="sales-calendar-field">Event type <span>*</span>
                  <select required value={form.values.type} onChange={(event) => setForm({ ...form, values: { ...form.values, type: event.target.value } })}>{eventTypes.map((type) => <option key={type}>{type}</option>)}</select>
                </label>
                <label className="sales-calendar-field">Date <span>*</span>
                  <input type="date" required value={form.values.date} onChange={(event) => setForm({ ...form, values: { ...form.values, date: event.target.value } })} />
                </label>
              </div>
              <div className="sales-calendar-form-row">
                <label className="sales-calendar-field">Start time{["Call", "Meeting"].includes(form.values.type) ? <span> *</span> : null}
                  <input type="time" required={["Call", "Meeting"].includes(form.values.type)} value={form.values.startTime} onChange={(event) => setForm({ ...form, values: { ...form.values, startTime: event.target.value } })} />
                </label>
                <label className="sales-calendar-field">End time{["Call", "Meeting"].includes(form.values.type) ? <span> *</span> : null}
                  <input type="time" required={["Call", "Meeting"].includes(form.values.type)} value={form.values.endTime} onChange={(event) => setForm({ ...form, values: { ...form.values, endTime: event.target.value } })} />
                </label>
              </div>
              <label className="sales-calendar-field sales-calendar-field-full">Related lead or customer
                <select value={form.values.relatedTo} onChange={(event) => setForm({ ...form, values: { ...form.values, relatedTo: event.target.value } })}><option value="">None</option><optgroup label="Leads">{relatedChoices.filter((choice) => choice.kind === "Lead").map((choice) => <option key={choice.id} value={choice.id}>{choice.name}{choice.company ? ` · ${choice.company}` : ""}</option>)}</optgroup><optgroup label="Customers">{relatedChoices.filter((choice) => choice.kind === "Customer").map((choice) => <option key={choice.id} value={choice.id}>{choice.name}{choice.company ? ` · ${choice.company}` : ""}</option>)}</optgroup></select>
              </label>
              <label className="sales-calendar-field sales-calendar-field-full">Notes
                <textarea rows="3" value={form.values.notes} onChange={(event) => setForm({ ...form, values: { ...form.values, notes: event.target.value } })} placeholder="Add a note for this event" />
              </label>
              {formError && <p className="sales-calendar-form-error" role="alert">{formError}</p>}
              <div className="sales-calendar-dialog-actions"><button type="button" className="sales-calendar-secondary-button" onClick={() => setForm(null)}>Cancel</button><button type="submit" className="sales-calendar-primary-button">{form.mode === "edit" ? "Save changes" : "Create event"}</button></div>
            </form>
          </section>
        </div>
      )}

      {selectedEvent && (
        <div className="sales-calendar-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelectedEventId(null); }}>
          <section className="sales-calendar-dialog sales-calendar-details" role="dialog" aria-modal="true" aria-labelledby="sales-calendar-detail-title">
            <div className="sales-calendar-dialog-heading"><div><span className={`sales-calendar-type-badge type-${selectedEvent.type.toLowerCase().replace("-", "")}`}>{selectedEvent.type}</span><h2 id="sales-calendar-detail-title">{selectedEvent.title}</h2></div><button className="sales-calendar-icon-button" type="button" aria-label="Close" onClick={() => setSelectedEventId(null)}><X size={19} /></button></div>
            <div className="sales-calendar-detail-line"><Clock3 size={17} /><span>{displayDate(new Date(selectedEvent.start))}{selectedEvent.start.includes("T") ? `, ${displayTime(new Date(selectedEvent.start))}${selectedEvent.end ? ` – ${displayTime(new Date(selectedEvent.end))}` : ""}` : " · All day"}</span></div>
            {selectedEvent.relatedTo && <div className="sales-calendar-detail-block"><span>Related to</span><strong>{relatedNames[selectedEvent.relatedTo] || "Record unavailable"}</strong></div>}
            <div className="sales-calendar-detail-block"><span>Notes</span><p>{selectedEvent.notes || "No notes added."}</p></div>
            <div className="sales-calendar-dialog-actions sales-calendar-detail-actions"><button type="button" className="sales-calendar-delete-button" onClick={() => setDeleteConfirmation(true)}><Trash2 size={16} /> Delete</button><button type="button" className="sales-calendar-secondary-button" onClick={openEditEvent}><Pencil size={15} /> Edit event</button></div>
          </section>
        </div>
      )}

      {deleteConfirmation && selectedEvent && (
        <div className="sales-calendar-backdrop sales-calendar-confirm-backdrop">
          <section className="sales-calendar-confirm" role="alertdialog" aria-modal="true" aria-labelledby="sales-calendar-delete-title">
            <h2 id="sales-calendar-delete-title">Delete this event?</h2><p>“{selectedEvent.title}” will be removed from your calendar.</p>
            <div className="sales-calendar-dialog-actions"><button type="button" className="sales-calendar-secondary-button" onClick={() => setDeleteConfirmation(false)}>Cancel</button><button type="button" className="sales-calendar-delete-confirm" onClick={deleteEvent}>Delete event</button></div>
          </section>
        </div>
      )}
    </div>
  );
}

export default SalesCalendar;

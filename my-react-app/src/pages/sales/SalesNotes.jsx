import { useState } from "react";
import { Link } from "react-router-dom";
import { Pencil, Search, Trash2 } from "lucide-react";
import FormModal from "../../components/common/FormModal.jsx";
import ConfirmDialog from "../../components/common/ConfirmDialog.jsx";
import AddButton from "../../components/sales/AddButton.jsx";
import { getLeadContactName, useSalesData } from "../../components/sales/SalesDataContext.jsx";
import "./SalesNotes.css";

const noteFilters = ["All Notes", "Recent"];

function formatNoteDate(note) {
  const wasUpdated = note.updatedAt && note.updatedAt !== note.createdAt;
  const date = new Date(wasUpdated ? note.updatedAt : note.createdAt);
  return `${wasUpdated ? "Updated" : "Created"} ${new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date)}`;
}

function SalesNotes() {
  const { leads, customers, notes, addNote, updateNote, deleteNote } = useSalesData();
  const [today] = useState(() => new Date());
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("All Notes");
  const [form, setForm] = useState(null);
  const [formError, setFormError] = useState("");
  const [openNoteId, setOpenNoteId] = useState(null);
  const [noteToDelete, setNoteToDelete] = useState(null);

  const relatedOptions = [
    ...leads.map((lead) => ({
      id: lead.id,
      type: "Lead",
      name: getLeadContactName(lead),
    })),
    ...customers.map((customer) => ({
      id: customer.id,
      type: "Customer",
      name: customer.name,
    })),
  ];
  const searchText = search.trim().toLowerCase();
  const recentCutoff = today.getTime() - 7 * 24 * 60 * 60 * 1000;
  const visibleNotes = notes
    .filter((note) => {
      const matchesSearch = !searchText ||
        `${note.title} ${note.content}`.toLowerCase().includes(searchText);
      const matchesFilter = activeFilter === "All Notes" ||
        (activeFilter === "Recent" && new Date(note.updatedAt || note.createdAt).getTime() >= recentCutoff);
      return matchesSearch && matchesFilter;
    })
    .sort((first, second) => (second.updatedAt || second.createdAt).localeCompare(first.updatedAt || first.createdAt));
  const openNote = notes.find((note) => note.id === openNoteId);

  const showAddForm = () => {
    setForm({ id: null, title: "", content: "", relatedType: "", relatedId: "" });
    setFormError("");
  };

  const showEditForm = (note) => {
    setOpenNoteId(null);
    setForm({
      id: note.id,
      title: note.title,
      content: note.content,
      relatedType: note.relatedTo?.type || "",
      relatedId: note.relatedTo?.id || "",
    });
    setFormError("");
  };

  const saveNote = (event) => {
    event.preventDefault();
    if (!form.title.trim() || !form.content.trim()) {
      setFormError("Add a title and note content.");
      return;
    }

    if (form.id) {
      const existingNote = notes.find((note) => note.id === form.id);
      if (existingNote) updateNote(existingNote, form);
    } else {
      addNote(form);
    }
    setForm(null);
  };

  const removeNote = (note) => {
    setNoteToDelete(note);
  };

  const confirmDeleteNote = () => {
    deleteNote(noteToDelete);
    setOpenNoteId(null);
    setNoteToDelete(null);
  };

  const relatedLink = (relatedTo) => {
    if (!relatedTo) return null;
    return (
      <Link
        className="sales-notes-related-link"
        to={relatedTo.type === "Lead" ? `/leads/${relatedTo.id}` : "/customers"}
      >
        {relatedTo.type}: {relatedTo.name}
      </Link>
    );
  };

  return (
    <div className="sales-notes-page">
      <header className="sales-notes-header">
        <div>
          <h1>Notes</h1>
          <p>Keep important customer conversations and details close at hand.</p>
        </div>
        <AddButton onClick={showAddForm}>Add Note</AddButton>
      </header>

      <section className="sales-notes-card" aria-label="Sales notes">
        <div className="sales-notes-toolbar">
          <div className="sales-notes-filters" role="group" aria-label="Filter notes">
            {noteFilters.map((filter) => (
              <button
                key={filter}
                className={`sales-notes-filter ${activeFilter === filter ? "active" : ""}`}
                type="button"
                aria-pressed={activeFilter === filter}
                onClick={() => setActiveFilter(filter)}
              >
                {filter}
              </button>
            ))}
          </div>
          <label className="sales-notes-search">
            <Search size={17} strokeWidth={1.8} aria-hidden="true" />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search notes"
              aria-label="Search notes by title or content"
            />
          </label>
        </div>

        {visibleNotes.length ? (
          <div className="sales-notes-list">
            {visibleNotes.map((note) => (
              <article className="sales-note-item" key={note.id}>
                <div className="sales-note-content">
                  <button className="sales-note-title" type="button" onClick={() => setOpenNoteId(note.id)}>
                    {note.title}
                  </button>
                  <p className="sales-note-preview">{note.content}</p>
                  {relatedLink(note.relatedTo)}
                  <span className="sales-note-date">{formatNoteDate(note)}</span>
                </div>
                <div className="sales-note-actions">
                  <button className="sales-note-action" type="button" onClick={() => showEditForm(note)}>
                    <Pencil size={15} /> Edit
                  </button>
                  <button className="sales-note-action delete" type="button" onClick={() => removeNote(note)}>
                    <Trash2 size={15} /> Delete
                  </button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p className="sales-notes-empty">
            {notes.length ? "No notes match your search or filter." : "No notes yet. Add a note to keep important details close at hand."}
          </p>
        )}
      </section>

      {form && (
        <form onSubmit={saveNote}>
          <FormModal
            title={form.id ? "Edit Note" : "Add Note"}
            onClose={() => setForm(null)}
            actions={<><button className="form-modal-cancel" type="button" onClick={() => setForm(null)}>Cancel</button><button className="form-modal-submit" type="submit">Save Note</button></>}
          >
            <label className="sales-form-field">Title *
              <input autoFocus required value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} />
            </label>
            <label className="sales-form-field">Content *
              <textarea required rows="6" value={form.content} onChange={(event) => setForm({ ...form, content: event.target.value })} />
            </label>
            <label className="sales-form-field">Related lead or customer
              <select value={form.relatedType && form.relatedId ? `${form.relatedType}|${form.relatedId}` : ""} onChange={(event) => {
                const [relatedType = "", relatedId = ""] = event.target.value.split("|");
                setForm({ ...form, relatedType, relatedId });
              }}>
                <option value="">None</option>
                {relatedOptions.map((option) => <option key={option.id} value={`${option.type}|${option.id}`}>{option.type}: {option.name}</option>)}
              </select>
            </label>
            {formError && <p className="sales-form-error" role="alert">{formError}</p>}
          </FormModal>
        </form>
      )}

      {openNote && (
        <FormModal
          title={openNote.title}
          onClose={() => setOpenNoteId(null)}
          actions={<><button className="form-modal-cancel" type="button" onClick={() => setOpenNoteId(null)}>Close</button><button className="form-modal-submit" type="button" onClick={() => showEditForm(openNote)}>Edit Note</button></>}
        >
          <p className="sales-note-full-content">{openNote.content}</p>
          {openNote.relatedTo && <div className="sales-note-detail-related">Related to {relatedLink(openNote.relatedTo)}</div>}
          <p className="sales-note-date">{formatNoteDate(openNote)}</p>
        </FormModal>
      )}
      {noteToDelete && <ConfirmDialog title="Delete note?" message={`Are you sure you want to delete “${noteToDelete.title}”? This action cannot be undone.`} onCancel={() => setNoteToDelete(null)} onConfirm={confirmDeleteNote} />}
    </div>
  );
}

export default SalesNotes;

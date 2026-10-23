import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { Pencil, Search, Trash2 } from "lucide-react";
import FormModal from "../../components/common/FormModal.jsx";
import ConfirmDialog from "../../components/common/ConfirmDialog.jsx";
import AddButton from "../../components/sales/AddButton.jsx";
import { getLeadContactName } from "../../components/sales/SalesDataContext.jsx";
import { auth } from "../../firebase.js";
import "./SalesNotes.css";

const noteFilters = ["All Notes", "Recent"];
const API_BASE_URL = (import.meta.env.VITE_API_URL || "http://localhost:5000").replace(/\/$/, "");
const SALES_API_URL = `${API_BASE_URL}/api/v1/sales`;

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
  const [notes, setNotes] = useState([]);
  const [leads, setLeads] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [today] = useState(() => new Date());
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("All Notes");
  const [form, setForm] = useState(null);
  const [formError, setFormError] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [openNoteId, setOpenNoteId] = useState(null);
  const [noteToDelete, setNoteToDelete] = useState(null);

  useEffect(() => onAuthStateChanged(auth, async (user) => {
    if (!user) {
      setNotes([]);
      setLeads([]);
      setCustomers([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");
    try {
      const idToken = await auth.currentUser.getIdToken();
      const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${idToken}`,
      };
      const [notesResponse, leadsResponse, customersResponse] = await Promise.all([
        fetch(`${SALES_API_URL}/notes`, { headers }),
        fetch(`${SALES_API_URL}/leads`, { headers }),
        fetch(`${SALES_API_URL}/customers`, { headers }),
      ]);
      const [notesResult, leadsResult, customersResult] = await Promise.all([
        notesResponse.json(),
        leadsResponse.json(),
        customersResponse.json(),
      ]);

      if (!notesResponse.ok || notesResult.success === false) {
        throw new Error(notesResult.message || "Unable to load notes.");
      }
      if (!leadsResponse.ok || leadsResult.success === false) {
        throw new Error(leadsResult.message || "Unable to load leads.");
      }
      if (!customersResponse.ok || customersResult.success === false) {
        throw new Error(customersResult.message || "Unable to load customers.");
      }

      setNotes(Array.isArray(notesResult.data) ? notesResult.data : []);
      setLeads(Array.isArray(leadsResult.data) ? leadsResult.data : []);
      setCustomers(Array.isArray(customersResult.data) ? customersResult.data : []);
    } catch (requestError) {
      setNotes([]);
      setLeads([]);
      setCustomers([]);
      setError(requestError.message || "Unable to load notes.");
    } finally {
      setLoading(false);
    }
  }), []);

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

  const saveNote = async (event) => {
    event.preventDefault();
    if (!form.title.trim() || !form.content.trim()) {
      setFormError("Add a title and note content.");
      return;
    }

    setFormError("");
    try {
      const idToken = await auth.currentUser.getIdToken();
      const response = await fetch(
        form.id ? `${SALES_API_URL}/notes/${encodeURIComponent(form.id)}` : `${SALES_API_URL}/notes`,
        {
          method: form.id ? "PATCH" : "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${idToken}`,
          },
          body: JSON.stringify({
            title: form.title.trim(),
            content: form.content.trim(),
            relatedType: form.relatedType || null,
            relatedId: form.relatedId || null,
          }),
        }
      );
      const result = await response.json();

      if (!response.ok || result.success === false) {
        throw new Error(result.message || "Unable to save note.");
      }

      if (form.id) {
        setNotes((currentNotes) => currentNotes.map((note) => note.id === result.data.id ? result.data : note));
      } else {
        setNotes((currentNotes) => [result.data, ...currentNotes]);
      }
      setForm(null);
      setError("");
    } catch (requestError) {
      setFormError(requestError.message || "Unable to save note.");
    }
  };

  const removeNote = (note) => {
    setNoteToDelete(note);
  };

  const confirmDeleteNote = async () => {
    try {
      const idToken = await auth.currentUser.getIdToken();
      const response = await fetch(`${SALES_API_URL}/notes/${encodeURIComponent(noteToDelete.id)}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
      });
      const result = await response.json();

      if (!response.ok || result.success === false) {
        throw new Error(result.message || "Unable to delete note.");
      }

      setNotes((currentNotes) => currentNotes.filter((note) => note.id !== noteToDelete.id));
      setOpenNoteId(null);
      setNoteToDelete(null);
      setError("");
    } catch (requestError) {
      setNoteToDelete(null);
      setError(requestError.message || "Unable to delete note.");
    }
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

        {error && <p className="sales-form-error" role="alert">{error}</p>}
        {loading && <p className="sales-note-date" role="status">Loading notes…</p>}
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
            {loading ? "Loading notes…" : error ? "Notes could not be loaded." : notes.length ? "No notes match your search or filter." : "No notes yet. Add a note to keep important details close at hand."}
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

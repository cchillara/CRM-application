import React, { useState, useEffect, useCallback } from "react";
import { onAuthStateChanged } from "firebase/auth";
import {
  Plus, X, Pencil, Trash2, Building, Timer,
  History, User, Calendar, Check,
} from "lucide-react";
import SidePanel from "../../client-admin-portal/components/Side-panel";
import { formatToMonthDateYear } from "../../client-admin-portal/components/FormatDate";
import { getFollowUps, createFollowUp, updateFollowUp, deleteFollowUp } from "../../client-admin-portal/Api/followUp";
import { auth } from "../../firebase.js";
import "../../client-admin-portal/styles/Leads.css";
import "./SalesTasks.css";

const API_BASE_URL = (import.meta.env.VITE_API_URL || "http://localhost:5000").replace(/\/$/, "");
const SALES_API_URL = `${API_BASE_URL}/api/v1/sales`;

const EMPTY_FORM = { title: "", client: "", assignedTo: "Sarah Jenkins", due: "", priority: "Medium" };
const OWNERS = ["Sarah Jenkins", "Arjun Kumar", "David Miller", "Elena Rostova", "Marcus Vance", "Meena Patel", "Vikram Singh"];

const priorityClass = (p) => {
  const pr = String(p || "").toLowerCase();
  if (pr === "high") return "badge-pending";
  if (pr === "medium") return "badge-progress";
  return "badge-active";
};

export default function SalesTasks() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);

  // Side panel
  const [selectedTask, setSelectedTask] = useState(null);
  const [activeTab, setActiveTab] = useState("followup");
  const [followUpDesc, setFollowUpDesc] = useState("");
  const [nextFollowUpDate, setNextFollowUpDate] = useState("");
  const [followUpList, setFollowUpList] = useState([]);
  const [editingFollowUpId, setEditingFollowUpId] = useState(null);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const idToken = await auth.currentUser?.getIdToken();
      const headers = { "Content-Type": "application/json", ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}) };
      const res = await fetch(`${SALES_API_URL}/tasks`, { headers });
      const result = await res.json();
      const data = result.data || [];

      const mapped = data.map((t) => {
        let meta = {};
        if (t.description && t.description.startsWith("{")) { try { meta = JSON.parse(t.description); } catch (_) {} }
        const clientName = meta.client || t.client || t.customer?.company?.name || t.lead?.title || t.deal?.title || "—";
        const assignedOwner = (t.assignedTo ? `${t.assignedTo.firstName} ${t.assignedTo.lastName || ""}`.trim() : null) || meta.assignedTo || t.assignedTo || "Sarah Jenkins";
        const rawDue = meta.due || t.dueDate || t.due;
        return {
          id: t.id,
          title: t.title,
          client: clientName,
          assignedTo: assignedOwner,
          due: rawDue ? formatToMonthDateYear(rawDue) : "Upcoming",
          rawDue,
          priority: meta.priority || t.priority || "Medium",
          completed: t.status === "COMPLETED",
        };
      });
      setTasks(mapped);
    } catch (err) {
      console.error("[SalesTasks] Fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => { if (user) fetchTasks(); else { setTasks([]); setLoading(false); } });
    return unsub;
  }, [fetchTasks]);

  // Load follow-ups when task selected
  useEffect(() => {
    if (selectedTask) {
      setFollowUpList([]);
      setEditingFollowUpId(null);
      setFollowUpDesc("");
      setNextFollowUpDate("");
      getFollowUps("task", selectedTask.id)
        .then((data) => setFollowUpList(Array.isArray(data) ? data : []))
        .catch((err) => { console.warn("Follow-ups load error:", err.message); setFollowUpList([]); });
    }
  }, [selectedTask]);

  const handleAddFollowUp = async (e) => {
    e.preventDefault();
    if (!followUpDesc.trim()) return;

    if (editingFollowUpId) {
      try {
        const updated = await updateFollowUp(editingFollowUpId, {
          description: followUpDesc.trim(),
          nextFollowUpDate: nextFollowUpDate ? formatToMonthDateYear(nextFollowUpDate) : null,
        });
        setFollowUpList((prev) => prev.map((f) => f.id === editingFollowUpId
          ? { ...f, description: followUpDesc.trim(), nextFollowUpDate: nextFollowUpDate ? formatToMonthDateYear(nextFollowUpDate) : f.nextFollowUpDate, ...(updated && typeof updated === "object" ? updated : {}) }
          : f));
      } catch (err) {
        setFollowUpList((prev) => prev.map((f) => f.id === editingFollowUpId ? { ...f, description: followUpDesc.trim() } : f));
      }
      setEditingFollowUpId(null);
      setFollowUpDesc("");
      setNextFollowUpDate("");
    } else {
      const payload = {
        entityType: "task",
        entityId: String(selectedTask.id),
        description: followUpDesc.trim(),
        nextFollowUpDate: nextFollowUpDate ? formatToMonthDateYear(nextFollowUpDate) : null,
        author: selectedTask.assignedTo,
      };
      try {
        const saved = await createFollowUp(payload);
        setFollowUpList((prev) => [saved, ...prev]);
        setFollowUpDesc("");
        setNextFollowUpDate("");
      } catch (err) {
        alert("Failed to save follow-up: " + err.message);
      }
    }
  };

  const handleDeleteFollowUp = async (id) => {
    try { await deleteFollowUp(id); setFollowUpList((prev) => prev.filter((f) => f.id !== id)); }
    catch (err) { alert("Failed to delete follow-up: " + err.message); }
  };

  const handleEditFollowUp = (item) => {
    setEditingFollowUpId(item.id);
    setFollowUpDesc(item.description);
    setNextFollowUpDate(item.nextFollowUpDate || "");
  };

  const handleCancelEditFollowUp = () => { setEditingFollowUpId(null); setFollowUpDesc(""); setNextFollowUpDate(""); };

  const toggleTask = async (id) => {
    const target = tasks.find((t) => t.id === id);
    if (!target) return;
    const newCompleted = !target.completed;
    setTasks((prev) => prev.map((t) => t.id === id ? { ...t, completed: newCompleted } : t));
    if (selectedTask?.id === id) setSelectedTask((prev) => ({ ...prev, completed: newCompleted }));
    try {
      const idToken = await auth.currentUser?.getIdToken();
      await fetch(`${SALES_API_URL}/tasks/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}) },
        body: JSON.stringify({ status: newCompleted ? "COMPLETED" : "TODO" }),
      });
    } catch (err) { console.error("[SalesTasks] Toggle error:", err); }
  };

  const openAdd = () => { setEditingTask(null); setForm(EMPTY_FORM); setIsModalOpen(true); };
  const openEdit = (task) => {
    setEditingTask(task);
    setForm({ title: task.title, client: task.client === "—" ? "" : task.client, assignedTo: task.assignedTo, due: task.rawDue ? String(task.rawDue).slice(0, 10) : "", priority: task.priority });
    setIsModalOpen(true);
  };
  const handleClose = () => { setIsModalOpen(false); setEditingTask(null); setForm(EMPTY_FORM); };
  const handleChange = (e) => { const { name, value } = e.target; setForm((p) => ({ ...p, [name]: value })); };

  const handleSave = async (e) => {
    e.preventDefault();
    const idToken = await auth.currentUser?.getIdToken();
    const headers = { "Content-Type": "application/json", ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}) };
    const payload = { title: form.title.trim(), description: JSON.stringify({ client: form.client.trim(), assignedTo: form.assignedTo, due: form.due, priority: form.priority }), dueDate: form.due || null, priority: form.priority, status: "TODO" };

    if (editingTask) {
      const optimistic = { ...editingTask, title: form.title.trim(), client: form.client.trim() || "—", assignedTo: form.assignedTo, due: form.due ? formatToMonthDateYear(form.due) : "Upcoming", rawDue: form.due, priority: form.priority };
      setTasks((prev) => prev.map((t) => t.id === editingTask.id ? optimistic : t));
      if (selectedTask?.id === editingTask.id) setSelectedTask(optimistic);
      try { await fetch(`${SALES_API_URL}/tasks/${editingTask.id}`, { method: "PATCH", headers, body: JSON.stringify(payload) }); } catch (err) { console.warn("Update error:", err.message); }
    } else {
      try {
        const res = await fetch(`${SALES_API_URL}/tasks`, { method: "POST", headers, body: JSON.stringify(payload) });
        const saved = await res.json();
        const newTask = { id: saved?.data?.id || Date.now(), title: form.title.trim(), client: form.client.trim() || "—", assignedTo: form.assignedTo, due: form.due ? formatToMonthDateYear(form.due) : "Upcoming", rawDue: form.due, priority: form.priority, completed: false };
        setTasks((prev) => [newTask, ...prev]);
      } catch (err) { console.warn("Create error:", err.message); }
    }
    handleClose();
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this task? This cannot be undone.")) return;
    setTasks((prev) => prev.filter((t) => t.id !== id));
    if (selectedTask?.id === id) setSelectedTask(null);
    try {
      const idToken = await auth.currentUser?.getIdToken();
      await fetch(`${SALES_API_URL}/tasks/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${idToken}` } });
    } catch (err) { console.warn("Delete error:", err.message); }
  };

  return (
    <div className="crm-dashboard">
      <div className="crm-top-header">
        <div>
          <h1 className="crm-page-title">Tasks</h1>
          <p className="crm-page-subtitle">Administrative and sales team action items</p>
        </div>
        <button type="button" className="crm-banner-btn crm-btn-primary" onClick={openAdd}>
          <Plus size={16} /><span>Add Task</span>
        </button>
      </div>

      {/* ── Add / Edit Modal ── */}
      {isModalOpen && (
        <div className="crm-modal-backdrop" onClick={handleClose}>
          <div className="crm-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="crm-modal-header">
              <div>
                <h2 className="crm-modal-title">{editingTask ? "Edit Task" : "Add New Task"}</h2>
                <p className="crm-card-subtitle" style={{ margin: 0 }}>{editingTask ? `Editing: ${editingTask.title}` : "Fill in the details to create a task"}</p>
              </div>
              <button type="button" className="crm-modal-close-btn" onClick={handleClose}><X size={18} /></button>
            </div>
            <form onSubmit={handleSave}>
              <div className="crm-modal-body">
                <div className="crm-form-group">
                  <label className="crm-form-label">Task Title *</label>
                  <input type="text" name="title" value={form.title} onChange={handleChange} placeholder="e.g. Follow up with ABC Technologies" className="crm-form-input" required autoFocus />
                </div>
                <div className="crm-form-row">
                  <div className="crm-form-group">
                    <label className="crm-form-label">Related Client</label>
                    <input type="text" name="client" value={form.client} onChange={handleChange} placeholder="e.g. ABC Technologies" className="crm-form-input" />
                  </div>
                  <div className="crm-form-group">
                    <label className="crm-form-label">Assigned Owner</label>
                    <select name="assignedTo" value={form.assignedTo} onChange={handleChange} className="crm-form-select">
                      {OWNERS.map((o) => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>
                </div>
                <div className="crm-form-row">
                  <div className="crm-form-group">
                    <label className="crm-form-label">Due Date</label>
                    <input type="date" name="due" value={form.due} onChange={handleChange} className="crm-form-input" />
                  </div>
                  <div className="crm-form-group">
                    <label className="crm-form-label">Priority</label>
                    <select name="priority" value={form.priority} onChange={handleChange} className="crm-form-select">
                      {["High", "Medium", "Low"].map((p) => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                </div>
              </div>
              <div className="crm-modal-footer">
                <button type="button" className="crm-btn-secondary" onClick={handleClose}>Cancel</button>
                <button type="submit" className="crm-banner-btn crm-btn-primary">{editingTask ? "Update Task" : "Save Task"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Side Panel ── */}
      <SidePanel
        isOpen={Boolean(selectedTask)}
        onClose={() => setSelectedTask(null)}
        title={selectedTask?.title}
        badges={selectedTask && (
          <>
            <span className={`crm-status-badge ${priorityClass(selectedTask.priority)}`}>{selectedTask.priority} Priority</span>
            <span className={`crm-status-badge ${selectedTask.completed ? "badge-active" : "badge-progress"}`}>{selectedTask.completed ? "Completed" : "In Progress"}</span>
          </>
        )}
        tabs={[
          { id: "followup", label: "Follow Up History", icon: History, badge: followUpList.length > 0 ? followUpList.length : null },
          { id: "details", label: "Task Details", icon: Building },
        ]}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      >
        {/* ── Follow Up Tab ── */}
        {activeTab === "followup" && (
          <section className="crm-slideover-section" aria-label="Follow up history">
            <div className="crm-slideover-section-header">
              <div className="crm-slideover-section-title"><History size={16} /><span>Follow Up History</span></div>
            </div>
            <form className="crm-fu-form-card" onSubmit={handleAddFollowUp}>
              <div className="crm-fu-form-group">
                <label className="crm-fu-form-label" htmlFor="task-fu-desc">Add follow up Note *</label>
                <textarea id="task-fu-desc" className="crm-fu-textarea" placeholder="Eg: Task discussed with client. Next action planned." value={followUpDesc} onChange={(e) => setFollowUpDesc(e.target.value)} required />
              </div>
              <div className="crm-fu-form-row">
                <div className="crm-fu-form-group">
                  <label className="crm-fu-form-label" htmlFor="task-fu-date">Next follow up date</label>
                  <input id="task-fu-date" type="date" className="crm-fu-input-date" value={nextFollowUpDate} onChange={(e) => setNextFollowUpDate(e.target.value)} />
                </div>
                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                  {editingFollowUpId && (
                    <button type="button" onClick={handleCancelEditFollowUp} style={{ padding: "6px 12px", fontSize: "13px", borderRadius: "6px", border: "1px solid #cbd5e1", background: "#f8fafc", cursor: "pointer" }}>Cancel</button>
                  )}
                  <button type="submit" className="crm-fu-add-btn">
                    {editingFollowUpId ? <Check size={15} /> : <Plus size={15} />}
                    <span>{editingFollowUpId ? "Update" : "Add"}</span>
                  </button>
                </div>
              </div>
            </form>
            <div className="crm-fu-timeline">
              {followUpList.length > 0 ? followUpList.map((item) => (
                <div key={item.id} className="crm-fu-timeline-item">
                  <div className="crm-fu-timeline-dot"><div className="crm-fu-timeline-dot-inner" /></div>
                  <div className="crm-fu-timeline-card">
                    <div className="crm-fu-timeline-top">
                      <span className="crm-fu-timeline-date">{item.createdAt}</span>
                      {item.author && <span className="crm-fu-timeline-author">{item.author}</span>}
                    </div>
                    <p className="crm-fu-timeline-desc">{item.description}</p>
                    <div className="crm-row-actions">
                      <button type="button" className="crm-action-icon-btn" title="Edit" onClick={() => handleEditFollowUp(item)}><Pencil size={14} /></button>
                      <button type="button" className="crm-action-icon-btn danger" title="Delete" onClick={() => handleDeleteFollowUp(item.id)}><Trash2 size={14} /></button>
                    </div>
                    {item.nextFollowUpDate && (
                      <div className="crm-fu-timeline-next-badge">
                        <Calendar size={12} />
                        <span>Next Follow-up: <strong>{item.nextFollowUpDate}</strong></span>
                      </div>
                    )}
                  </div>
                </div>
              )) : (
                <div className="crm-fu-empty">No earlier follow-up history recorded for this task yet.</div>
              )}
            </div>
          </section>
        )}

        {/* ── Details Tab ── */}
        {activeTab === "details" && selectedTask && (
          <section className="crm-slideover-section" aria-label="Task details">
            <div className="crm-slideover-section-header">
              <div className="crm-slideover-section-title"><Building size={16} /><span>Task Details</span></div>
            </div>
            <div className="crm-lead-details-grid">
              <div className="crm-lead-detail-item">
                <span className="crm-lead-detail-label">ID</span>
                <span className="crm-lead-detail-value">{selectedTask.id}</span>
              </div>
              <div className="crm-lead-detail-item">
                <span className="crm-lead-detail-label"><Building size={12} /> Client</span>
                <span className="crm-lead-detail-value">{selectedTask.client}</span>
              </div>
              <div className="crm-lead-detail-item">
                <span className="crm-lead-detail-label"><User size={12} /> Assigned Owner</span>
                <span className="crm-lead-detail-value">{selectedTask.assignedTo}</span>
              </div>
              <div className="crm-lead-detail-item">
                <span className="crm-lead-detail-label"><Timer size={12} /> Due Date</span>
                <span className="crm-lead-detail-value">{selectedTask.due}</span>
              </div>
              <div className="crm-lead-detail-item">
                <span className="crm-lead-detail-label">Status</span>
                <span className="crm-lead-detail-value">
                  <span className={`crm-status-badge ${selectedTask.completed ? "badge-active" : "badge-progress"}`}>
                    {selectedTask.completed ? "Completed" : "In-Progress"}
                  </span>
                </span>
              </div>
              <div className="crm-lead-detail-item">
                <span className="crm-lead-detail-label">Priority</span>
                <span className="crm-lead-detail-value">
                  <span className={`crm-status-badge ${priorityClass(selectedTask.priority)}`}>{selectedTask.priority}</span>
                </span>
              </div>
            </div>
          </section>
        )}
      </SidePanel>

      {/* ── Tasks Table ── */}
      <div className="crm-card">
        <div className="crm-table-container">
          <table className="crm-table">
            <thead>
              <tr>
                <th style={{ width: "40px" }}>Done</th>
                <th>Task &amp; ID</th>
                <th>Related Client</th>
                <th>Assigned Owner</th>
                <th>Due Date</th>
                <th>Priority</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((t) => (
                <tr key={t.id} className="crm-clickable-row" onClick={() => { setSelectedTask(t); setActiveTab("followup"); }} title="Click to view follow up history & task details">
                  <td>
                    <input type="checkbox" checked={t.completed} onChange={() => toggleTask(t.id)} onClick={(e) => e.stopPropagation()} style={{ width: "16px", height: "16px", accentColor: "var(--blue-primary)", cursor: "pointer" }} />
                  </td>
                  <td>
                    <span className="crm-table-primary-text" style={{ textDecoration: t.completed ? "line-through" : "none", color: t.completed ? "#94a3b8" : "inherit" }}>{t.title}</span>
                    <span className="crm-table-sub-text">{t.id}</span>
                  </td>
                  <td><span className="crm-table-primary-text">{t.client}</span></td>
                  <td><span className="crm-table-primary-text">{t.assignedTo}</span></td>
                  <td><span className="crm-table-sub-text">{t.due}</span></td>
                  <td><span className={`crm-status-badge ${priorityClass(t.priority)}`}>{t.priority}</span></td>
                  <td onClick={(e) => e.stopPropagation()}>
                    <div className="crm-row-actions">
                      <button type="button" className="crm-action-icon-btn" title="Edit task" onClick={(e) => { e.stopPropagation(); openEdit(t); }}><Pencil size={14} /></button>
                      <button type="button" className="crm-action-icon-btn danger" title="Delete task" onClick={(e) => { e.stopPropagation(); handleDelete(t.id); }}><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {tasks.length === 0 && <div className="crm-empty-state">{loading ? "Loading tasks…" : "No tasks found."}</div>}
        </div>
      </div>
    </div>
  );
}

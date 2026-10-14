import React, { useState, useEffect } from 'react';
import { initialTasks } from '../data';
import { getStored, setStored } from '../storage';
import { Plus, X, Pencil, Trash2 } from 'lucide-react';
import { getTasks, createTask, updateTask, deleteTask } from './../Api/Tasks';

const STORAGE_KEY = 'tasks';
const EMPTY_FORM = { title: '', client: '', assignedTo: 'Sarah Jenkins', due: '', priority: 'Medium' };
const OWNERS = ['Sarah Jenkins', 'Arjun Kumar', 'David Miller', 'Elena Rostova', 'Marcus Vance', 'Meena Patel', 'Vikram Singh'];

export default function Tasks() {
  const [tasks, setTasks] = useState(() => getStored(STORAGE_KEY, initialTasks));
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const persist = (updated) => { setTasks(updated); setStored(STORAGE_KEY, updated); };

  /* Load tasks from API on mount */
  useEffect(() => {
    getTasks()
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          const mapped = data.map((t) => ({
            id: t.id,
            title: t.title || 'Untitled Task',
            client: t.client || t.lead?.title || t.leadTitle || 'General',
            assignedTo: typeof t.assignedTo === 'string' ? t.assignedTo : (t.assignedTo?.firstName || 'Sarah Jenkins'),
            due: t.due || (t.dueDate ? new Date(t.dueDate).toLocaleDateString() : 'Upcoming'),
            priority: t.priority ? (t.priority.charAt(0).toUpperCase() + t.priority.slice(1).toLowerCase()) : 'Medium',
            completed: t.completed !== undefined ? t.completed : t.status === 'COMPLETED',
          }));
          persist(mapped);
        }
      })
      .catch((err) => console.warn('[Tasks] API unavailable, using local data:', err.message));
  }, []);

  const toggleTask = async (id) => {
    const target = tasks.find(t => t.id === id);
    persist(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
    try { await updateTask(id, { status: target?.completed ? 'TODO' : 'COMPLETED' }); }
    catch (err) { console.warn('[Tasks] Toggle API error:', err.message); }
  };

  const openAdd = () => { setEditingTask(null); setForm(EMPTY_FORM); setIsModalOpen(true); };
  const openEdit = (task) => {
    setEditingTask(task);
    setForm({ title: task.title, client: task.client, assignedTo: task.assignedTo, due: task.due, priority: task.priority });
    setIsModalOpen(true);
  };
  const handleClose = () => { setIsModalOpen(false); setEditingTask(null); setForm(EMPTY_FORM); };
  const handleChange = (e) => { const { name, value } = e.target; setForm(p => ({ ...p, [name]: value })); };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) { alert('Please enter a task title.'); return; }
    const payload = {
      title: form.title.trim(),
      client: form.client.trim() || 'General',
      assignedTo: form.assignedTo,
      due: form.due.trim() || 'Upcoming',
      priority: form.priority,
      status: 'TODO'
    };
    if (editingTask) {
      const optimistic = { ...editingTask, title: form.title.trim(), client: form.client.trim() || editingTask.client,
        assignedTo: form.assignedTo, due: form.due.trim() || editingTask.due, priority: form.priority };
      persist(tasks.map(t => t.id === editingTask.id ? optimistic : t));
      try {
        const saved = await updateTask(editingTask.id, payload);
        if (saved) setTasks(prev => prev.map(t => t.id === editingTask.id ? { ...t, ...saved } : t));
      }
      catch (err) { console.warn('[Tasks] Update API error:', err.message); }
    } else {
      const created = {
        id: `TSK-${100 + tasks.length + 1}`,
        title: form.title.trim(), client: form.client.trim() || 'General',
        assignedTo: form.assignedTo, due: form.due.trim() || 'Upcoming',
        priority: form.priority, completed: false
      };
      persist([created, ...tasks]);
      try {
        const saved = await createTask(payload);
        if (saved?.id) setTasks(prev => prev.map(t => t.id === created.id ? { ...t, ...saved } : t));
      } catch (err) { console.warn('[Tasks] Create API error:', err.message); }
    }
    handleClose();
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this task?')) return;
    persist(tasks.filter(t => t.id !== id));
    try { await deleteTask(id); }
    catch (err) { console.warn('[Tasks] Delete API error:', err.message); }
  };

  const priorityClass = (p) => p === 'High' ? 'badge-pending' : p === 'Medium' ? 'badge-progress' : 'badge-active';

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

      {isModalOpen && (
        <div className="crm-modal-backdrop" onClick={handleClose}>
          <div className="crm-modal-card" onClick={e => e.stopPropagation()}>
            <div className="crm-modal-header">
              <div>
                <h2 className="crm-modal-title">{editingTask ? 'Edit Task' : 'Add New Task'}</h2>
                <p className="crm-card-subtitle" style={{ margin: 0 }}>
                  {editingTask ? `Editing: ${editingTask.id}` : 'Assign an actionable task or reminder'}
                </p>
              </div>
              <button type="button" className="crm-modal-close-btn" onClick={handleClose}><X size={18} /></button>
            </div>
            <form onSubmit={handleSave}>
              <div className="crm-modal-body">
                <div className="crm-form-group">
                  <label className="crm-form-label">Task Title *</label>
                  <input type="text" name="title" value={form.title} onChange={handleChange}
                    placeholder="e.g. Schedule product demo for Skyline" className="crm-form-input" required autoFocus />
                </div>
                <div className="crm-form-row">
                  <div className="crm-form-group">
                    <label className="crm-form-label">Related Client</label>
                    <input type="text" name="client" value={form.client} onChange={handleChange}
                      placeholder="e.g. TechNova Solutions" className="crm-form-input" />
                  </div>
                  <div className="crm-form-group">
                    <label className="crm-form-label">Assigned Owner</label>
                    <select name="assignedTo" value={form.assignedTo} onChange={handleChange} className="crm-form-select">
                      {OWNERS.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>
                </div>
                <div className="crm-form-row">
                  <div className="crm-form-group">
                    <label className="crm-form-label">Due Date</label>
                    <input type="text" name="due" value={form.due} onChange={handleChange}
                      placeholder="e.g. Tomorrow, 5:00 PM" className="crm-form-input" />
                  </div>
                  <div className="crm-form-group">
                    <label className="crm-form-label">Priority</label>
                    <select name="priority" value={form.priority} onChange={handleChange} className="crm-form-select">
                      {['High', 'Medium', 'Low'].map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                </div>
              </div>
              <div className="crm-modal-footer">
                <button type="button" className="crm-btn-secondary" onClick={handleClose}>Cancel</button>
                <button type="submit" className="crm-banner-btn crm-btn-primary">
                  {editingTask ? 'Update Task' : 'Save Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="crm-card">
        <div className="crm-table-container">
          <table className="crm-table">
            <thead>
              <tr>
                <th style={{ width: '40px' }}>Done</th>
                <th>Task & ID</th>
                <th>Related Client</th>
                <th>Assigned Owner</th>
                <th>Due Date</th>
                <th>Priority</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((t) => (
                <tr key={t.id}>
                  <td>
                    <input type="checkbox" checked={t.completed} onChange={() => toggleTask(t.id)}
                      style={{ width: '16px', height: '16px', accentColor: 'var(--blue-primary)', cursor: 'pointer' }} />
                  </td>
                  <td>
                    <span className="crm-table-primary-text"
                      style={{ textDecoration: t.completed ? 'line-through' : 'none', color: t.completed ? '#94a3b8' : 'inherit' }}>
                      {t.title}
                    </span>
                    <span className="crm-table-sub-text">{t.id}</span>
                  </td>
                  <td><span className="crm-table-primary-text">{t.client}</span></td>
                  <td><span className="crm-table-primary-text">{t.assignedTo}</span></td>
                  <td><span className="crm-table-sub-text">{t.due}</span></td>
                  <td><span className={`crm-status-badge ${priorityClass(t.priority)}`}>{t.priority}</span></td>
                  <td>
                    <div className="crm-row-actions">
                      <button type="button" className="crm-action-icon-btn" title="Edit task" onClick={() => openEdit(t)}>
                        <Pencil size={14} />
                      </button>
                      <button type="button" className="crm-action-icon-btn danger" title="Delete task" onClick={() => handleDelete(t.id)}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {tasks.length === 0 && <div className="crm-empty-state">No tasks found.</div>}
        </div>
      </div>
    </div>
  );
}

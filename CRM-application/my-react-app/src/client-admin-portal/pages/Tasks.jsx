import React, { useState, useEffect } from 'react';
import { initialTasks } from '../data';
import { getStored, setStored } from '../storage';
import { Plus, X, Pencil, Trash2, Building, Timer, History, User, Calendar, Check } from 'lucide-react';
import { getTasks, createTask, updateTask, deleteTask } from './../Api/Tasks';
import "../styles/Leads.css"
import SidePanel from '../components/Side-panel';
import { formatToMonthDateYear } from '../components/FormatDate';
import { getFollowUps, createFollowUp, updateFollowUp, deleteFollowUp } from '../Api/followUp';


const STORAGE_KEY = 'tasks';
const EMPTY_FORM = { title: '', client: '', assignedTo: 'Sarah Jenkins', due: '', priority: 'Medium' };
const OWNERS = ['Sarah Jenkins', 'Arjun Kumar', 'David Miller', 'Elena Rostova', 'Marcus Vance', 'Meena Patel', 'Vikram Singh'];



export function resolveOwnerName(raw, fallbackSeed = 0) {
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
    ? Math.abs(fallbackSeed) % OWNERS.length
    : Math.abs(String(fallbackSeed).split('').reduce((sum, c) => sum + c.charCodeAt(0), 0)) % OWNERS.length;
  return OWNERS[idx];
}


export default function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const [selectedTask, setSelectedTask] = useState(null);
const [activeTab, setActiveTab] = useState('followup'); 
const [followUpDesc, setFollowUpDesc] = useState('');
const [nextFollowUpDate, setNextFollowUpDate] = useState('');
const [followUpList, setFollowUpList] = useState([]);
const [editingFollowUpId, setEditingFollowUpId] = useState(null);


  const persist = (updated) => { setTasks(updated); setStored(STORAGE_KEY, updated); };


  useEffect(() => {
    getTasks()
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          const mapped = data.map((t, idx) => ({
            id: t.id,
            title: t.title,
            client: t.client,
            assignedTo: resolveOwnerName(t.assignedTo, t.title || idx),
            due: t.due ? formatToMonthDateYear(t.due) : (t.dueDate ? formatToMonthDateYear(t.dueDate) : 'Upcoming'),
            priority: t.priority,
            completed: t.completed !== undefined ? t.completed : t.status === 'COMPLETED',
          }));
          
          setTasks(mapped);
        } else if (Array.isArray(data) && data.length === 0) {
        
          setTasks(getStored(STORAGE_KEY, initialTasks));
        }
      })
      .catch(() => {
        setTasks(getStored(STORAGE_KEY, initialTasks));
      });
  }, []);


    useEffect(() => {
      if (selectedTask) {
        setFollowUpList([]);
        setEditingFollowUpId(null);
        getFollowUps('task', selectedTask.id)
          .then((data) => {
            if (Array.isArray(data)) {
              setFollowUpList(data);
            } else {
              setFollowUpList([]);
            }
          })
          .catch((err) => {
            console.warn('Failed to load follow-ups from API:', err.message);
            setFollowUpList([]);
          });

        setFollowUpDesc('');
        setNextFollowUpDate('');
      }
    }, [selectedTask]);

  const handleAddFollowUp = async (e) => {
      e.preventDefault();
      if (!followUpDesc.trim()) return;

      if (editingFollowUpId) {
        try {
          const updated = await updateFollowUp(editingFollowUpId, {
            description: followUpDesc.trim(),
            nextFollowUpDate: nextFollowUpDate ? formatToMonthDateYear(nextFollowUpDate) : null
          });
          setFollowUpList(prev => prev.map(f => f.id === editingFollowUpId ? { ...f, description: followUpDesc.trim(), nextFollowUpDate: nextFollowUpDate ? formatToMonthDateYear(nextFollowUpDate) : f.nextFollowUpDate, ...(updated && typeof updated === 'object' ? updated : {}) } : f));
        } catch (err) {
          console.warn('API update follow-up failed:', err.message);
          setFollowUpList(prev => prev.map(f => f.id === editingFollowUpId ? { ...f, description: followUpDesc.trim(), nextFollowUpDate: nextFollowUpDate ? formatToMonthDateYear(nextFollowUpDate) : f.nextFollowUpDate } : f));
        }
        setEditingFollowUpId(null);
        setFollowUpDesc('');
        setNextFollowUpDate('');
      } else {
        const payload = {
          entityType: 'task',
          entityId: String(selectedTask.id),
          description: followUpDesc.trim(),
          nextFollowUpDate: nextFollowUpDate ? formatToMonthDateYear(nextFollowUpDate) : null,
          author: selectedTask?.assignedTo || 'Sarah Jenkins'
        };

        try {
          const saved = await createFollowUp(payload);
          setFollowUpList(prev => [saved, ...prev]);
        } catch (err) {
          console.warn('API follow-up save failed, falling back to local storage:', err.message);
          const newEntry = {
            id: Date.now(),
            description: followUpDesc.trim(),
            nextFollowUpDate: nextFollowUpDate ? formatToMonthDateYear(nextFollowUpDate) : '',
            createdAt: new Date().toLocaleDateString('en-US', {
              month: '2-digit',
              day: '2-digit',
              year: 'numeric'
            }) + ', ' + new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
            author: selectedTask?.assignedTo
          };
          const updated = [newEntry, ...followUpList];
          setFollowUpList(updated);
          if (selectedTask) {
            localStorage.setItem(`crm_task_followups_${selectedTask.id}`, JSON.stringify(updated));
          }
        }

        setFollowUpDesc('');
        setNextFollowUpDate('');
      }
    };

  const handleDeleteFollowUp = async (id) => {
    try {
      await deleteFollowUp(id);
    } catch (err) {
      console.warn('API delete follow-up failed:', err.message);
    }
    setFollowUpList(prev => prev.filter(item => item.id !== id));
  };

  const handleEditFollowUp = (item) => {
    setEditingFollowUpId(item.id);
    setFollowUpDesc(item.description);
    setNextFollowUpDate(item.nextFollowUpDate || '');
  };

  const handleCancelEditFollowUp = () => {
    setEditingFollowUpId(null);
    setFollowUpDesc('');
    setNextFollowUpDate('');
  };

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
      client: form.client.trim() ,
      assignedTo: form.assignedTo,
      due: form.due.trim() ,
      priority: form.priority,
      status: 'TODO'
    };
    if (editingTask) {
      const optimistic = { ...editingTask, title: form.title.trim(), client: form.client.trim() || editingTask.client,
        assignedTo: form.assignedTo, due: form.due.trim() || editingTask.due, priority: form.priority };
      persist(tasks.map(t => t.id === editingTask.id ? optimistic : t));
      if (selectedTask && selectedTask.id === editingTask.id) {
        setSelectedTask(optimistic);
      }
      try {
        const saved = await updateTask(editingTask.id, payload);
        if (saved) setTasks(prev => prev.map(t => t.id === editingTask.id ? { ...t, ...saved } : t));
      }
      catch (err) { console.warn('[Tasks] Update API error:', err.message); }
    } else {
      const created = {
        id: `TSK-${100 + tasks.length + 1}`,
        title: form.title.trim(), client: form.client.trim() ,
        assignedTo: form.assignedTo, due: form.due.trim() ,
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
    if (selectedTask && selectedTask.id === id) {
      setSelectedTask(null);
    }
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

      <SidePanel 
      isOpen={Boolean(selectedTask)}
      onClose={() => setSelectedTask(null)}
      title={selectedTask?.title}
        badges={
          selectedTask && (
            <>
            <span className="crm-tier-tag">{selectedTask.client}  </span>
              {/* <span style={{ fontSize: "15px", fontFamily: "BlinkMacSystemFont" }}>  {selectedTask.completed ? ' Completed' : ' In-Progress'}</span> */}
            </>
          )
        }
        tabs={[
          {
            id : 'followup',
            label : 'Follow up history',
            icon : History,
            badge : followUpList.length > 0 ? followUpList.length : null
          },
          {
            id : 'details',
            label : 'Task Details',
            icon : Building
          }
        ]}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      >
        {activeTab === 'followup' && (
          <section className="crm-slideover-section" aria-label="Follow up history">
            <div className="crm-slideover-section-header">
              <div className="crm-slideover-section-title">
                <History size={16} />
                <span>Follow Up history</span>
              </div>
            </div>

            <form className="crm-fu-form-card" onSubmit={handleAddFollowUp}>
              <div className="crm-fu-form-group">
                <label className="crm-fu-form-label" htmlFor="lead-fu-desc-input">
                  Add follow up Update *
                </label>
                <textarea
                  id="lead-fu-desc-input"
                  className="crm-fu-textarea"
                  placeholder="Eg :  Task is in progresss & assigned to Hermonie Granger "
                  value={followUpDesc}
                  onChange={(e) => setFollowUpDesc(e.target.value)}
                  required
                />
              </div>

              <div className="crm-fu-form-row">
                <div className="crm-fu-form-group">
                  <label className="crm-fu-form-label" htmlFor="lead-fu-next-date">
                    Next follow up date
                  </label>
                  <input
                    id="lead-fu-next-date"
                    type="date"
                    className="crm-fu-input-date"
                    value={nextFollowUpDate}
                    onChange={(e) => setNextFollowUpDate(e.target.value)}
                  />
                </div>

                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  {editingFollowUpId && (
                    <button
                      type="button"
                      className="crm-fu-cancel-btn"
                      onClick={handleCancelEditFollowUp}
                      style={{ padding: '6px 12px', fontSize: '13px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#f8fafc', cursor: 'pointer' }}
                    >
                      Cancel
                    </button>
                  )}
                  <button type="submit" className="crm-fu-add-btn">
                    {editingFollowUpId ? <Check size={15} /> : <Plus size={15} />}
                    <span>{editingFollowUpId ? 'Update' : 'Add'}</span>
                  </button>
                </div>
              </div>
            </form>

            <div className="crm-fu-timeline">
              {followUpList.length > 0 ? (
                followUpList.map((item) => (
                  <div key={item.id} className="crm-fu-timeline-item">
                    <div className="crm-fu-timeline-dot">
                      <div className="crm-fu-timeline-dot-inner" />
                    </div>
                    <div className="crm-fu-timeline-card">
                      <div className="crm-fu-timeline-top">
                        <span className="crm-fu-timeline-date">{item.createdAt}</span>
                        {item.author && <span className="crm-fu-timeline-author">{item.author}</span>}
                      </div>
                      <p className="crm-fu-timeline-desc">{item.description}</p>
                      <div className="crm-row-actions">
                        <button type="button" className="crm-action-icon-btn" title="Edit follow-up" onClick={() => handleEditFollowUp(item)}>
                          <Pencil size={14} />
                        </button>
                        <button type="button" className="crm-action-icon-btn danger" title="Delete follow-up" onClick={() => handleDeleteFollowUp(item.id)}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                      {item.nextFollowUpDate && (
                        <div className="crm-fu-timeline-next-badge">
                          <Calendar size={12} />
                          <span>Next Follow-up: <strong>{item.nextFollowUpDate}</strong></span>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="crm-fu-empty">
                  No earlier follow-up history recorded for this tasks yet.
                </div>
              )}
            </div>
          </section>
        )}

        {activeTab === 'details' && selectedTask && (
          <section className="crm-slideover-section" aria-label="Lead details">
            <div className="crm-slideover-section-header">
              <div className="crm-slideover-section-title">
                <Building size={16} />
                <span>Task details</span>
              </div>
              
            </div>

            <div className="crm-lead-details-grid">
              <div className="crm-lead-detail-item crm-lead-detail-full">
                <span className="crm-lead-detail-label">Task description</span>
                <p className="crm-lead-detail-desc">
                  This is the description of the selected task.
                </p>
              </div>

              <div className="crm-lead-detail-item">
                <span className="crm-lead-detail-label">Id</span>
                <span className="crm-lead-detail-value">
                  {selectedTask.id}
                </span>
              </div>

               <div className="crm-lead-detail-item">
                <span className="crm-lead-detail-label">
                <Building size={12}/>
                Client</span>
                <span className="crm-lead-detail-value">
                  
                  {selectedTask.client}
                </span>
              </div>

              <div className="crm-lead-detail-item">
                <span className="crm-lead-detail-label">
                  <User size={12} /> Assigned Owner
                </span>
                <span className="crm-lead-detail-value">{selectedTask.assignedTo}</span>
              </div>

              <div className="crm-lead-detail-item">
                <span className="crm-lead-detail-label">
                  <Timer size={12} /> Due Date
                </span>
                <span className="crm-lead-detail-value">{selectedTask.due}</span>
              </div>

              {/* <div className="crm-lead-detail-item">
                <span className="crm-lead-detail-label">
                  <Calendar size={12} /> Created date
                </span>
                <span className="crm-lead-detail-value">{selectedTask.createdAt}</span>
              </div> */}

              <div className="crm-lead-detail-item">
                <span className="crm-lead-detail-label">Status</span>
                <span className="crm-lead-detail-value">

                  <span className="crm-lead-detail-label">{selectedTask.completed ? "Completed" : "In-Progress"}</span>
                </span>
              </div>

              <div className="crm-lead-detail-item">
                <span className="crm-lead-detail-label">Priority</span>
                <span className="crm-lead-detail-value">
                  <span className="crm-lead-detail-label">
                    {selectedTask.priority}
                  </span>
                </span>
              </div>

              
            </div>
          </section>
        )}


      </SidePanel>

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
                <tr key={t.id}
                className="crm-clickable-row"
                onClick={() => setSelectedTask(t)}
                title="Click to view follow up hostory & task details "
                >
                  <td>
                    <input type="checkbox" checked={t.completed} onChange={() => toggleTask(t.id)} onClick={(e) => e.stopPropagation()}
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
                      <button type="button" className="crm-action-icon-btn" title="Edit task" onClick={(e) => {openEdit(t); e.stopPropagation();}}>
                        <Pencil size={14} />
                      </button>
                      <button type="button" className="crm-action-icon-btn danger" title="Delete task" onClick={(e) => {handleDelete(t.id) ; e.stopPropagation();}}>
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

import React, { useState, useEffect } from 'react';
import { teamMembers } from '../data';
import { getStored, setStored } from '../storage';
import {
  Plus, X, Pencil, Trash2,
  History, User, Mail, Briefcase,
  TrendingUp, DollarSign, Check, Calendar,
} from 'lucide-react';
import { getTeams, createTeam, updateTeam, deleteTeam } from './../Api/Teams';
import SidePanel from '../components/Side-panel';
import { getFollowUps, createFollowUp, updateFollowUp, deleteFollowUp } from '../Api/followUp';
import { formatToMonthDateYear } from '../components/FormatDate';
import '../styles/Leads.css';

const STORAGE_KEY = 'teams';
const EMPTY_FORM = {
  name: '', role: 'Account Executive', email: '',
  dealsClosed: '0', revenueWon: '₹0.0L', status: 'Active'
};

export default function Teams() {
  const [members, setMembers] = useState(() => getStored(STORAGE_KEY, teamMembers));
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);


  const [selectedMember, setSelectedMember] = useState(null);
  const [activeTab, setActiveTab] = useState('followup');
  const [followUpDesc, setFollowUpDesc] = useState('');
  const [nextFollowUpDate, setNextFollowUpDate] = useState('');
  const [followUpList, setFollowUpList] = useState([]);
  const [editingFollowUpId, setEditingFollowUpId] = useState(null);

  const persist = (updated) => { setMembers(updated); setStored(STORAGE_KEY, updated); };

  useEffect(() => {
    getTeams()
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          const mapped = data.map((m) => ({
            id: m.id,
            name: m.name || `${m.firstName || ''} ${m.lastName || ''}`.trim() || 'Team Member',
            role: m.role,
            email: m.email,
            dealsClosed: Number(m.dealsClosed) || 0,
            revenueWon: m.revenueWon || '₹0.0L',
            status: m.status === 'ACTIVE' || m.status === 'Active' ? 'Active' : 'Inactive',
          }));
          persist(mapped);
        }
      })
      .catch((err) => console.warn('[Teams] API unavailable, using local data:', err.message));
  }, []);

  useEffect(() => {
    if (selectedMember) {
      setFollowUpList([]);
      setEditingFollowUpId(null);
      getFollowUps('team', selectedMember.id)
        .then((data) => {
          if (Array.isArray(data)) setFollowUpList(data);
          else setFollowUpList([]);
        })
        .catch((err) => {
          console.warn('Failed to load team follow-ups:', err.message);
          setFollowUpList([]);
        });
      setFollowUpDesc('');
      setNextFollowUpDate('');
    }
  }, [selectedMember]);


  const handleAddFollowUp = async (e) => {
    e.preventDefault();
    if (!followUpDesc.trim()) return;

    if (editingFollowUpId) {
      try {
        const updated = await updateFollowUp(editingFollowUpId, {
          description: followUpDesc.trim(),
          nextFollowUpDate: nextFollowUpDate ? formatToMonthDateYear(nextFollowUpDate) : null,
        });
        setFollowUpList((prev) =>
          prev.map((f) =>
            f.id === editingFollowUpId
              ? {
                  ...f,
                  description: followUpDesc.trim(),
                  nextFollowUpDate: nextFollowUpDate
                    ? formatToMonthDateYear(nextFollowUpDate)
                    : f.nextFollowUpDate,
                  ...(updated && typeof updated === 'object' ? updated : {}),
                }
              : f
          )
        );
      } catch (err) {
        console.warn('API update follow-up failed:', err.message);
        setFollowUpList((prev) =>
          prev.map((f) =>
            f.id === editingFollowUpId
              ? {
                  ...f,
                  description: followUpDesc.trim(),
                  nextFollowUpDate: nextFollowUpDate
                    ? formatToMonthDateYear(nextFollowUpDate)
                    : f.nextFollowUpDate,
                }
              : f
          )
        );
      }
      setEditingFollowUpId(null);
      setFollowUpDesc('');
      setNextFollowUpDate('');
    } else {
      const payload = {
        entityType: 'team',
        entityId: String(selectedMember.id),
        description: followUpDesc.trim(),
        nextFollowUpDate: nextFollowUpDate ? formatToMonthDateYear(nextFollowUpDate) : null,
        author: selectedMember.name,
      };
      try {
        const saved = await createFollowUp(payload);
        setFollowUpList((prev) => [saved, ...prev]);
        setFollowUpDesc('');
        setNextFollowUpDate('');
      } catch (err) {
        alert('Failed to save follow-up: ' + err.message);
      }
    }
  };

  const handleDeleteFollowUp = async (id) => {
    try {
      await deleteFollowUp(id);
      setFollowUpList((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      alert('Failed to delete follow-up: ' + err.message);
    }
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

  const openAdd = () => { setEditingMember(null); setForm(EMPTY_FORM); setIsModalOpen(true); };
  const openEdit = (m) => {
    setEditingMember(m);
    setForm({
      name: m.name, role: m.role, email: m.email,
      dealsClosed: String(m.dealsClosed), revenueWon: m.revenueWon, status: m.status,
    });
    setIsModalOpen(true);
  };
  const handleClose = () => { setIsModalOpen(false); setEditingMember(null); setForm(EMPTY_FORM); };
  const handleChange = (e) => { const { name, value } = e.target; setForm((p) => ({ ...p, [name]: value })); };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) { alert('Please enter name and email.'); return; }
    const payload = {
      name: form.name.trim(),
      role: form.role.trim() || 'Account Executive',
      email: form.email.trim(),
      dealsClosed: Number(form.dealsClosed) || 0,
      revenueWon: form.revenueWon.trim() || '₹0.0L',
      status: form.status || 'Active',
    };
    if (editingMember) {
      const optimistic = { ...editingMember, ...payload };
      persist(members.map((m) => (m.id === editingMember.id ? optimistic : m)));
      if (selectedMember && selectedMember.id === editingMember.id) setSelectedMember(optimistic);
      try {
        const saved = await updateTeam(editingMember.id, payload);
        if (saved) setMembers((prev) => prev.map((m) => (m.id === editingMember.id ? { ...m, ...saved } : m)));
      } catch (err) { console.warn('[Teams] Update API error:', err.message); }
    } else {
      const created = { id: `TM-${String(members.length + 1).padStart(2, '0')}`, ...payload };
      persist([created, ...members]);
      try {
        const saved = await createTeam(payload);
        if (saved?.id) setMembers((prev) => prev.map((m) => (m.id === created.id ? { ...m, ...saved } : m)));
      } catch (err) { console.warn('[Teams] Create API error:', err.message); }
    }
    handleClose();
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Remove this team member?')) return;
    persist(members.filter((m) => m.id !== id));
    if (selectedMember && selectedMember.id === id) setSelectedMember(null);
    try { await deleteTeam(id); }
    catch (err) { console.warn('[Teams] Delete API error:', err.message); }
  };

  const statusColor = (st) => (st === 'Active' ? 'badge-active' : 'badge-pending');

  return (
    <div className="crm-dashboard">

      <div className="crm-top-header">
        <div>
          <h1 className="crm-page-title">Team Performance</h1>
          <p className="crm-page-subtitle">Manage client sales reps, territories, and quota achievements</p>
        </div>
        <button type="button" className="crm-banner-btn crm-btn-primary" onClick={openAdd}>
          <Plus size={16} /><span>Invite Member</span>
        </button>
      </div>

      {isModalOpen && (
        <div className="crm-modal-backdrop" onClick={handleClose}>
          <div className="crm-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="crm-modal-header">
              <div>
                <h2 className="crm-modal-title">{editingMember ? 'Edit Member' : 'Invite Team Member'}</h2>
                <p className="crm-card-subtitle" style={{ margin: 0 }}>
                  {editingMember ? `Editing: ${editingMember.name}` : 'Onboard a sales executive or account manager'}
                </p>
              </div>
              <button type="button" className="crm-modal-close-btn" onClick={handleClose}><X size={18} /></button>
            </div>
            <form onSubmit={handleSave}>
              <div className="crm-modal-body">
                <div className="crm-form-group">
                  <label className="crm-form-label">Full Name *</label>
                  <input type="text" name="name" value={form.name} onChange={handleChange}
                    placeholder="e.g. Ramesh Varma" className="crm-form-input" required autoFocus />
                </div>
                <div className="crm-form-row">
                  <div className="crm-form-group">
                    <label className="crm-form-label">Email Address *</label>
                    <input type="email" name="email" value={form.email} onChange={handleChange}
                      placeholder="ramesh.v@crmclient.com" className="crm-form-input" required />
                  </div>
                  <div className="crm-form-group">
                    <label className="crm-form-label">Revenue Won</label>
                    <input type="text" name="revenueWon" value={form.revenueWon} onChange={handleChange}
                      placeholder="e.g. ₹15.0L" className="crm-form-input" />
                  </div>
                </div>
                <div className="crm-form-row">
                  <div className="crm-form-group">
                    <label className="crm-form-label">Status</label>
                    <select name="status" value={form.status} onChange={handleChange} className="crm-form-select">
                      {['Active', 'Pending Invite', 'On Leave', 'Inactive'].map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                  <div className="crm-form-group">
                    <label className="crm-form-label">Deals Closed</label>
                    <input type="number" name="dealsClosed" value={form.dealsClosed} onChange={handleChange}
                      placeholder="e.g. 5" className="crm-form-input" />
                  </div>
                </div>
                <div className="crm-form-group">
                  <label className="crm-form-label">Designation / Role</label>
                  <input type="text" name="role" value={form.role} onChange={handleChange}
                    placeholder="e.g. Account Executive" className="crm-form-input" />
                </div>
              </div>
              <div className="crm-modal-footer">
                <button type="button" className="crm-btn-secondary" onClick={handleClose}>Cancel</button>
                <button type="submit" className="crm-banner-btn crm-btn-primary">
                  {editingMember ? 'Update Member' : 'Send Invite'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <SidePanel
        isOpen={Boolean(selectedMember)}
        onClose={() => setSelectedMember(null)}
        title={selectedMember?.name}
        badges={
          selectedMember && (
            <>
              <span className="crm-tier-tag">{selectedMember.role}</span>
              <span className={`crm-status-badge ${statusColor(selectedMember.status)}`} style={{ fontSize: '12px' }}>
                {selectedMember.status}
              </span>
            </>
          )
        }
        tabs={[
          {
            id: 'followup',
            label: 'Follow Up History',
            icon: History,
            badge: followUpList.length > 0 ? followUpList.length : null,
          },
          {
            id: 'details',
            label: 'Member Details',
            icon: User,
          },
        ]}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      >
       
        {activeTab === 'followup' && (
          <section className="crm-slideover-section" aria-label="Follow up history">
            <div className="crm-slideover-section-header">
              <div className="crm-slideover-section-title">
                <History size={16} />
                <span>Follow Up History</span>
              </div>
            </div>

            <form className="crm-fu-form-card" onSubmit={handleAddFollowUp}>
              <div className="crm-fu-form-group">
                <label className="crm-fu-form-label" htmlFor="team-fu-desc-input">
                  Add Follow Up Note *
                </label>
                <textarea
                  id="team-fu-desc-input"
                  className="crm-fu-textarea"
                  placeholder="e.g. Discussed Q4 targets and pipeline review."
                  value={followUpDesc}
                  onChange={(e) => setFollowUpDesc(e.target.value)}
                  required
                />
              </div>

              <div className="crm-fu-form-row">
                <div className="crm-fu-form-group">
                  <label className="crm-fu-form-label" htmlFor="team-fu-next-date">
                    Next follow up date
                  </label>
                  <input
                    id="team-fu-next-date"
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
                      style={{
                        padding: '6px 12px', fontSize: '13px', borderRadius: '6px',
                        border: '1px solid #cbd5e1', background: '#f8fafc', cursor: 'pointer',
                      }}
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
                        <button
                          type="button"
                          className="crm-action-icon-btn"
                          title="Edit follow-up"
                          onClick={() => handleEditFollowUp(item)}
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          type="button"
                          className="crm-action-icon-btn danger"
                          title="Delete follow-up"
                          onClick={() => handleDeleteFollowUp(item.id)}
                        >
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
                  No follow-up history recorded for this team member yet.
                </div>
              )}
            </div>
          </section>
        )}

        {activeTab === 'details' && selectedMember && (
          <section className="crm-slideover-section" aria-label="Member details">
            <div className="crm-slideover-section-header">
              <div className="crm-slideover-section-title">
                <User size={16} />
                <span>Member Details</span>
              </div>
            </div>

            <div className="crm-lead-details-grid">
         
              <div className="crm-lead-detail-item crm-lead-detail-full" style={{ alignItems: 'center' }}>
                <div
                  className="crm-avatar-pill"
                  style={{
                    width: '56px', height: '56px', borderRadius: '50%',
                    fontSize: '20px', fontWeight: 700,
                    backgroundColor: '#eff6ff', color: '#1d4ed8',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    marginBottom: '8px',
                  }}
                >
                  {selectedMember.name.slice(0, 2).toUpperCase()}
                </div>
                <span className="crm-lead-detail-label" style={{ marginTop: '4px' }}>Team Member ID</span>
                <span className="crm-lead-detail-value" style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  {selectedMember.id}
                </span>
              </div>

              <div className="crm-lead-detail-item">
                <span className="crm-lead-detail-label">
                  <Mail size={12} /> Email Address
                </span>
                <span className="crm-lead-detail-value">{selectedMember.email}</span>
              </div>

              <div className="crm-lead-detail-item">
                <span className="crm-lead-detail-label">
                  <Briefcase size={12} /> Designation
                </span>
                <span className="crm-lead-detail-value">{selectedMember.role}</span>
              </div>

              <div className="crm-lead-detail-item">
                <span className="crm-lead-detail-label">
                  <TrendingUp size={12} /> Deals Closed
                </span>
                <span className="crm-lead-detail-value" style={{ fontWeight: 700 }}>
                  {selectedMember.dealsClosed} deals
                </span>
              </div>

              <div className="crm-lead-detail-item">
                <span className="crm-lead-detail-label">
                  <DollarSign size={12} /> Revenue Won
                </span>
                <span className="crm-lead-detail-value" style={{ color: '#059669', fontWeight: 700 }}>
                  {selectedMember.revenueWon}
                </span>
              </div>

              <div className="crm-lead-detail-item">
                <span className="crm-lead-detail-label">Account Status</span>
                <span className="crm-lead-detail-value">
                  <span className={`crm-status-badge ${statusColor(selectedMember.status)}`}>
                    {selectedMember.status}
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
                <th>Team Member</th>
                <th>Designation</th>
                <th>Email Address</th>
                <th>Won Deals</th>
                <th>Revenue</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {members.map((m) => (
                <tr
                  key={m.id}
                  className="crm-clickable-row"
                  onClick={() => { setSelectedMember(m); setActiveTab('followup'); }}
                  title="Click to view Follow Up history & Member details"
                >
                  <td>
                    <div className="crm-table-user-cell">
                      <div className="crm-avatar-pill" style={{ backgroundColor: '#eff6ff', color: '#1d4ed8' }}>
                        {m.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <span className="crm-table-primary-text">{m.name}</span>
                        <span className="crm-table-sub-text">{m.id}</span>
                      </div>
                    </div>
                  </td>
                  <td><span className="crm-table-primary-text">{m.role}</span></td>
                  <td><span className="crm-table-sub-text">{m.email}</span></td>
                  <td><strong>{m.dealsClosed} deals</strong></td>
                  <td>
                    <span style={{ color: '#10b981', fontWeight: '600' }}>{m.revenueWon}</span>
                  </td>
                  <td>
                    <span className={`crm-status-badge ${statusColor(m.status)}`}>{m.status}</span>
                  </td>
                  <td onClick={(e) => e.stopPropagation()}>
                    <div className="crm-row-actions">
                      <button type="button" className="crm-action-icon-btn" title="Edit member"
                        onClick={() => openEdit(m)}>
                        <Pencil size={14} />
                      </button>
                      <button type="button" className="crm-action-icon-btn danger" title="Remove member"
                        onClick={() => handleDelete(m.id)}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {members.length === 0 && <div className="crm-empty-state">No team members found.</div>}
        </div>
      </div>
    </div>
  );
}

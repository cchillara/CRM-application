import React, { useState, useEffect } from 'react';
import { teamMembers } from '../data';
import { getStored, setStored } from '../storage';
import { Plus, X, Pencil, Trash2 } from 'lucide-react';
import { getTeams, createTeam, updateTeam, deleteTeam } from './../Api/Teams';

const STORAGE_KEY = 'teams';
const EMPTY_FORM = { name: '', role: 'Account Executive', email: '', territory: 'APAC / Regional', dealsClosed: '0', revenueWon: '₹0.0L', status: 'Active' };

export default function Teams() {
  const [members, setMembers] = useState(() => getStored(STORAGE_KEY, teamMembers));
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const persist = (updated) => { setMembers(updated); setStored(STORAGE_KEY, updated); };

  /* Load teams from API on mount */
  useEffect(() => {
    getTeams()
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          const mapped = data.map((m) => ({
            id: m.id,
            name: m.name || `${m.firstName || ''} ${m.lastName || ''}`.trim() || 'Team Member',
            role: m.role || 'Account Executive',
            email: m.email || '',
            territory: m.territory || 'General',
            dealsClosed: Number(m.dealsClosed) || 0,
            revenueWon: m.revenueWon || '₹0.0L',
            status: m.status === 'ACTIVE' || m.status === 'Active' ? 'Active' : 'Inactive',
          }));
          persist(mapped);
        }
      })
      .catch((err) => console.warn('[Teams] API unavailable, using local data:', err.message));
  }, []);

  const openAdd = () => { setEditingMember(null); setForm(EMPTY_FORM); setIsModalOpen(true); };
  const openEdit = (m) => {
    setEditingMember(m);
    setForm({ name: m.name, role: m.role, email: m.email, territory: m.territory,
      dealsClosed: String(m.dealsClosed), revenueWon: m.revenueWon, status: m.status });
    setIsModalOpen(true);
  };
  const handleClose = () => { setIsModalOpen(false); setEditingMember(null); setForm(EMPTY_FORM); };
  const handleChange = (e) => { const { name, value } = e.target; setForm(p => ({ ...p, [name]: value })); };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) { alert('Please enter name and email.'); return; }
    const payload = {
      name: form.name.trim(),
      role: form.role.trim() || 'Account Executive',
      email: form.email.trim(),
      territory: form.territory.trim() || 'General',
      dealsClosed: Number(form.dealsClosed) || 0,
      revenueWon: form.revenueWon.trim() || '₹0.0L',
      status: form.status || 'Active'
    };
    if (editingMember) {
      const optimistic = { ...editingMember, ...payload };
      persist(members.map(m => m.id === editingMember.id ? optimistic : m));
      try {
        const saved = await updateTeam(editingMember.id, payload);
        if (saved) setMembers(prev => prev.map(m => m.id === editingMember.id ? { ...m, ...saved } : m));
      }
      catch (err) { console.warn('[Teams] Update API error:', err.message); }
    } else {
      const created = {
        id: `TM-${String(members.length + 1).padStart(2, '0')}`,
        ...payload
      };
      persist([created, ...members]);
      try {
        const saved = await createTeam(payload);
        if (saved?.id) setMembers(prev => prev.map(m => m.id === created.id ? { ...m, ...saved } : m));
      } catch (err) { console.warn('[Teams] Create API error:', err.message); }
    }
    handleClose();
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Remove this team member?')) return;
    persist(members.filter(m => m.id !== id));
    try { await deleteTeam(id); }
    catch (err) { console.warn('[Teams] Delete API error:', err.message); }
  };

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
          <div className="crm-modal-card" onClick={e => e.stopPropagation()}>
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
                    <label className="crm-form-label">Designation / Role</label>
                    <input type="text" name="role" value={form.role} onChange={handleChange}
                      placeholder="e.g. Account Executive" className="crm-form-input" />
                  </div>
                </div>
                <div className="crm-form-row">
                  <div className="crm-form-group">
                    <label className="crm-form-label">Territory / Region</label>
                    <input type="text" name="territory" value={form.territory} onChange={handleChange}
                      placeholder="e.g. India & Middle East" className="crm-form-input" />
                  </div>
                  <div className="crm-form-group">
                    <label className="crm-form-label">Status</label>
                    <select name="status" value={form.status} onChange={handleChange} className="crm-form-select">
                      {['Active', 'Pending Invite', 'On Leave', 'Inactive'].map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
                <div className="crm-form-row">
                  <div className="crm-form-group">
                    <label className="crm-form-label">Deals Closed</label>
                    <input type="number" name="dealsClosed" value={form.dealsClosed} onChange={handleChange}
                      placeholder="e.g. 5" className="crm-form-input" />
                  </div>
                  <div className="crm-form-group">
                    <label className="crm-form-label">Revenue Won</label>
                    <input type="text" name="revenueWon" value={form.revenueWon} onChange={handleChange}
                      placeholder="e.g. ₹15.0L" className="crm-form-input" />
                  </div>
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

      <div className="crm-card">
        <div className="crm-table-container">
          <table className="crm-table">
            <thead>
              <tr>
                <th>Sales Rep</th>
                <th>Designation</th>
                <th>Email Address</th>
                <th>Territory / Region</th>
                <th>Won Deals & Revenue</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {members.map((m) => (
                <tr key={m.id}>
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
                  <td><span className="crm-table-sub-text">{m.territory}</span></td>
                  <td>
                    <strong>{m.dealsClosed} deals</strong> · <span style={{ color: '#10b981', fontWeight: '600' }}>{m.revenueWon}</span>
                  </td>
                  <td>
                    <span className={`crm-status-badge ${m.status === 'Active' ? 'badge-active' : 'badge-pending'}`}>{m.status}</span>
                  </td>
                  <td>
                    <div className="crm-row-actions">
                      <button type="button" className="crm-action-icon-btn" title="Edit member" onClick={() => openEdit(m)}>
                        <Pencil size={14} />
                      </button>
                      <button type="button" className="crm-action-icon-btn danger" title="Remove member" onClick={() => handleDelete(m.id)}>
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

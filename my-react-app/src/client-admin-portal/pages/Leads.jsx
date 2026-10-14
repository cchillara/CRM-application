import React, { useState, useEffect } from 'react';
import { totalLeads } from '../data';
import { getStored, setStored } from '../storage';
import { Search, Plus, X, Pencil, Trash2 } from 'lucide-react';
import { getLeads, createLead, updateLead, deleteLead } from '../Api/Leads';

const STORAGE_KEY = 'leads';
const EMPTY_FORM = {
  name: '', contact: '', email: '', phone: '',
  tier: 'Growth', numericValue: '', status: 'Active',
  source: 'Website', assignedTo: ''
};

export default function Leads() {
  const [leadsList, setLeadsList] = useState(() => getStored(STORAGE_KEY, totalLeads));
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');



  // use effect
  useEffect(() => {
    setLoading(true);
    getLeads()
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          const mapped = data.map((l) => ({
            id: l.id,
            name: l.title || l.name || 'Unnamed',
            contact: (typeof l.contact === 'string' ? l.contact : l.contact?.name) || l.contactName || 'Direct Contact',
            email: (typeof l.contact === 'object' ? l.contact?.email : null) || l.email || 'contact@lead.com',
            phone: l.phone || (typeof l.contact === 'object' ? l.contact?.phone : null) || '-',
            tier: l.tier || 'Growth',
            avatarInitials: (l.title || l.name || 'NL').split(/\s+/).map((w) => w[0]).join('').substring(0, 2).toUpperCase(),
            status: l.status === 'NEW' ? 'Active' : (l.status?.charAt(0) + l.status?.slice(1).toLowerCase()) || 'Active',
            statusType: (l.status || 'active').toLowerCase(),
            value: l.value ? (typeof l.value === 'string' && l.value.startsWith('$') ? l.value : `$${Number(l.value).toLocaleString()}`) : '$0',
            numericValue: Number(l.numericValue ?? l.value) || 0,
            source: l.source || 'Website',
            assignedTo: typeof l.assignedTo === 'string' ? l.assignedTo : (l.assignedTo?.firstName ? `${l.assignedTo.firstName} ${l.assignedTo.lastName || ''}`.trim() : 'Unassigned'),
            date: l.createdAt ? new Date(l.createdAt).toLocaleDateString() : 'Recently',
          }));
          setLeadsList(mapped);
          setStored(STORAGE_KEY, mapped);
        }
      })
      .catch((err) => {
        console.warn('[Leads] API unavailable, using local data:', err.message);
      })
      .finally(() => setLoading(false));
  }, []);


  // arrow functions
  const persist = (updated) => {
    setLeadsList(updated);
    setStored(STORAGE_KEY, updated);
  };

  const filteredLeads = leadsList.filter((lead) => {
    const matchesFilter = filter === 'All' || lead.status === filter;
    const matchesSearch =
      lead.name.toLowerCase().includes(search.toLowerCase()) ||
      lead.contact.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });



  const statusSummary = ['Qualified', 'Contacted', 'Active', 'Pending', 'Unqualified'].map(label => {
    const statusLeads = leadsList.filter(l => l.status === label);
    return {
      label,
      count: statusLeads.length,
      percentage: leadsList.length ? Math.round((statusLeads.length / leadsList.length) * 100) : 0,
      color: { Qualified: '#10b981', Contacted: '#2563eb', Active: '#06b6d4', Pending: '#f59e0b', Unqualified: '#94a3b8' }[label]
    };
  });



  const openAdd = () => { setEditingLead(null); setForm(EMPTY_FORM); setIsModalOpen(true); };
  const openEdit = (lead) => {
    setEditingLead(lead);
    setForm({
      name: lead.name, contact: lead.contact, email: lead.email, phone: lead.phone || '',
      tier: lead.tier, numericValue: lead.numericValue || '', status: lead.status,
      source: lead.source || 'Website', assignedTo: lead.assignedTo || ''
    });
    setIsModalOpen(true);
  };


  const handleClose = () => { setIsModalOpen(false); setEditingLead(null); setForm(EMPTY_FORM); };
  const handleChange = (e) => { const { name, value } = e.target; setForm(prev => ({ ...prev, [name]: value })); };


  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { alert('Please enter a company or lead name.'); return; }

    const trimmedName = form.name.trim();
    const avatarInitials = trimmedName.split(/\s+/).map(w => w[0]).join('').substring(0, 2).toUpperCase() || 'NL';
    setApiError('');

    const payload = {
      title: trimmedName,
      name: trimmedName,
      contact: form.contact?.trim() || 'Direct Contact',
      email: form.email?.trim() || 'contact@lead.com',
      phone: form.phone?.trim() || '-',
      tier: form.tier || 'Growth',
      value: Number(form.numericValue) || 0,
      numericValue: Number(form.numericValue) || 0,
      status: form.status || 'Active',
      source: form.source || 'Website',
      assignedTo: form.assignedTo || 'Current User'
    };

    if (editingLead) {
      const optimistic = {
        ...editingLead,
        name: trimmedName, contact: form.contact || 'Direct Contact',
        email: form.email || editingLead.email, phone: form.phone || '-',
        tier: form.tier, avatarInitials, status: form.status,
        statusType: form.status.toLowerCase(),
        value: form.numericValue ? `$${Number(form.numericValue).toLocaleString()}` : editingLead.value,
        numericValue: Number(form.numericValue) || editingLead.numericValue,
        source: form.source, assignedTo: form.assignedTo || editingLead.assignedTo
      };
      persist(leadsList.map(l => l.id === editingLead.id ? optimistic : l));
      try {
        const saved = await updateLead(editingLead.id, payload);
        if (saved?.id) {
          setLeadsList(prev => prev.map(l => l.id === editingLead.id ? saved : l));
        }
      } catch (err) {
        console.warn('[Leads] Update API error (local state kept):', err.message);
      }
    }

    else {
      const lead = {
        id: `L${String(leadsList.length + 1).padStart(3, '0')}`,
        name: trimmedName, contact: form.contact || 'Direct Contact',
        email: form.email || 'contact@lead.com', phone: form.phone || '-',
        tier: form.tier || 'Growth', avatarInitials, status: form.status || 'Active',
        statusType: (form.status || 'active').toLowerCase(),
        value: form.numericValue ? `$${Number(form.numericValue).toLocaleString()}` : '$0',
        numericValue: Number(form.numericValue) || 0, source: form.source || 'Website',
        assignedTo: form.assignedTo || 'Current User', date: 'Just now'
      };
      persist([lead, ...leadsList]);
      try {
        const saved = await createLead(payload);
        if (saved?.id) {
          setLeadsList(prev => prev.map(l => l.id === lead.id ? saved : l));
        }
      } catch (err) {
        console.warn('[Leads] Create API error (local state kept):', err.message);
      }
    }
    handleClose();
  };


  const handleDelete = async (id) => {
    if (!window.confirm('Delete this lead? This action cannot be undone.')) return;
    persist(leadsList.filter(l => l.id !== id));
    try {
      await deleteLead(id);
    } catch (err) {
      console.warn('[Leads] Delete API error (removed from local view):', err.message);
    }
  };

  return (
    <div className="crm-dashboard">
      <div className="crm-top-header">
        <div>
          <h1 className="crm-page-title">Leads</h1>
          <p className="crm-page-subtitle">Manage customer leads and pipeline prospects</p>
        </div>
        <button type="button" className="crm-banner-btn crm-btn-primary" onClick={openAdd}>
          <Plus size={16} /><span>Add Lead</span>
        </button>
      </div>

      {/* Add / Edit Lead Modal */}
      {isModalOpen && (
        <div className="crm-modal-backdrop" onClick={handleClose}>
          <div className="crm-modal-card" onClick={e => e.stopPropagation()}>
            <div className="crm-modal-header">
              <div>
                <h2 className="crm-modal-title">{editingLead ? 'Edit Lead' : 'Add New Lead'}</h2>
                <p className="crm-card-subtitle" style={{ margin: 0 }}>
                  {editingLead ? `Editing: ${editingLead.name}` : 'Fill in the details to add a prospect'}
                </p>
              </div>
              <button type="button" className="crm-modal-close-btn" onClick={handleClose}><X size={18} /></button>
            </div>
            <form onSubmit={handleSave}>
              <div className="crm-modal-body">
                <div className="crm-form-group">
                  <label className="crm-form-label">Company / Organization Name *</label>
                  <input type="text" name="name" value={form.name} onChange={handleChange}
                    placeholder="e.g. Apex Global Systems" className="crm-form-input" required autoFocus />
                </div>
                <div className="crm-form-row">
                  <div className="crm-form-group">
                    <label className="crm-form-label">Contact Person</label>
                    <input type="text" name="contact" value={form.contact} onChange={handleChange}
                      placeholder="e.g. Rahul Sharma" className="crm-form-input" />
                  </div>
                  <div className="crm-form-group">
                    <label className="crm-form-label">Email Address</label>
                    <input type="email" name="email" value={form.email} onChange={handleChange}
                      placeholder="rahul@example.com" className="crm-form-input" />
                  </div>
                </div>
                <div className="crm-form-row">
                  <div className="crm-form-group">
                    <label className="crm-form-label">Phone Number</label>
                    <input type="text" name="phone" value={form.phone} onChange={handleChange}
                      placeholder="+91 98765 43210" className="crm-form-input" />
                  </div>
                  <div className="crm-form-group">
                    <label className="crm-form-label">Expected Value ($)</label>
                    <input type="number" name="numericValue" value={form.numericValue} onChange={handleChange}
                      placeholder="e.g. 35000" className="crm-form-input" />
                  </div>
                </div>
                <div className="crm-form-row">
                  <div className="crm-form-group">
                    <label className="crm-form-label">Tier</label>
                    <select name="tier" value={form.tier} onChange={handleChange} className="crm-form-select">
                      {['Starter', 'Growth', 'Pro', 'Enterprise'].map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div className="crm-form-group">
                    <label className="crm-form-label">Status</label>
                    <select name="status" value={form.status} onChange={handleChange} className="crm-form-select">
                      {['Active', 'Qualified', 'Contacted', 'Pending', 'Unqualified'].map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
                <div className="crm-form-row">
                  <div className="crm-form-group">
                    <label className="crm-form-label">Lead Source</label>
                    <select name="source" value={form.source} onChange={handleChange} className="crm-form-select">
                      {['Website', 'LinkedIn', 'Referral', 'Organic', 'Cold Outreach'].map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="crm-form-group">
                    <label className="crm-form-label">Assigned To</label>
                    <input type="text" name="assignedTo" value={form.assignedTo} onChange={handleChange}
                      placeholder="e.g. Sarah Jenkins" className="crm-form-input" />
                  </div>
                </div>
              </div>
              <div className="crm-modal-footer">
                <button type="button" className="crm-btn-secondary" onClick={handleClose}>Cancel</button>
                <button type="submit" className="crm-banner-btn crm-btn-primary">
                  {editingLead ? 'Update Lead' : 'Save Lead'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lead cards by status */}
      <div className="crm-kpi-grid" style={{ marginBottom: '20px' }}>
        {statusSummary.map((s) => (
          <div key={s.label} className="crm-kpi-card"
            style={{ borderTop: `3.5px solid ${s.color}`, cursor: 'pointer', outline: filter === s.label ? `2px solid ${s.color}` : 'none' }}
            onClick={() => setFilter(filter === s.label ? 'All' : s.label)}>
            <div className="crm-kpi-header">
              <span className="crm-kpi-title">{s.label} Leads</span>
              <span style={{ fontSize: '12px', fontWeight: '700', color: s.color }}>{s.percentage}%</span>
            </div>
            <div className="crm-kpi-body">
              <span className="crm-kpi-value">{s.count}</span>
              <div className="crm-kpi-footer">
                <span className="crm-kpi-subtext">{s.count} / {leadsList.length} total</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filter + Search Bar */}
      {/* <div className="crm-card crm-leads-filter-card">
        <div className="crm-leads-filter-toolbar">
          <div className="crm-leads-filter-group">
            {['All', 'Qualified', 'Active', 'Contacted', 'Pending', 'Unqualified'].map((status) => (
              <button key={status} type="button"
                className={`crm-filter-pill ${filter === status ? 'active' : ''}`}
                onClick={() => setFilter(status)}>{status}
              </button>
            ))}
          </div>
          <div className="crm-search-box">
            <Search size={16} color="#94a3b8" />
            <input type="text" placeholder="Search leads..." value={search}
              onChange={e => setSearch(e.target.value)} className="crm-search-input" />
          </div>
        </div>
      </div> */}

      {/* Leads Table */}
      <div className="crm-card">
        <div className="crm-table-container">
          <table className="crm-table">
            <thead>
              <tr>
                <th>Organization</th>
                <th>Contact Person</th>
                <th>Phone</th>
                <th>Tier</th>
                <th>Expected Value</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredLeads.map((lead) => (
                <tr key={lead.id}>
                  <td>
                    <div className="crm-table-user-cell">
                      <div className="crm-avatar-pill">{lead.avatarInitials}</div>
                      <div>
                        <span className="crm-table-primary-text">{lead.name}</span>
                        <span className="crm-table-sub-text">{lead.id} · {lead.source || 'Website'}</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="crm-table-primary-text">{lead.contact}</span>
                    <span className="crm-table-sub-text">{lead.email}</span>
                  </td>
                  <td>{lead.phone || '-'}</td>
                  <td><span className="crm-tier-tag">{lead.tier}</span></td>
                  <td><strong>{lead.value}</strong></td>
                  <td><span className={`crm-status-badge badge-${lead.statusType}`}>{lead.status}</span></td>
                  <td>
                    <div className="crm-row-actions">
                      <button type="button" className="crm-action-icon-btn" title="Edit lead" onClick={() => openEdit(lead)}>
                        <Pencil size={14} />
                      </button>
                      <button type="button" className="crm-action-icon-btn danger" title="Delete lead" onClick={() => handleDelete(lead.id)}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredLeads.length === 0 && <div className="crm-empty-state">No leads found matching current criteria.</div>}
        </div>
      </div>
    </div>
  );
}

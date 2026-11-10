import React, { useState, useEffect } from 'react';
import { totalLeads } from '../data';
import { getStored, setStored } from '../storage';
import {
  Plus,
  X,
  Pencil,
  Trash2,
  Building,
  Calendar,
  User,
  DollarSign,
  History,
  Sparkles,
  CheckSquare,
  Phone,
  Check,
} from 'lucide-react';
import SearchInput from '../components/Search';
import { formatToMonthDateYear } from '../components/FormatDate';
import { getLeads, createLead, updateLead, deleteLead } from '../Api/Leads';
import SidePanel from '../components/Side-panel';
import "../styles/Leads.css"
import { getFollowUps, createFollowUp, updateFollowUp, deleteFollowUp } from '../Api/followUp';

const STORAGE_KEY = 'leads';
const EMPTY_FORM = {
  name: '', contact: '', email: '', phone: '',
  tier: 'Growth', numericValue: '', status: 'NEW',
  source: 'Website', assignedTo: ''
};

const normalizeStatusDisplay = (st) => {
  if (!st) return 'Active';
  const u = String(st).toUpperCase().trim();
  if (u === 'NEW' || u === 'ACTIVE') return 'Active';
  if (u === 'PENDING') return 'Pending';
  if (u === 'CONTACTED') return 'Contacted';
  if (u === 'QUALIFIED') return 'Qualified';
  if (u === 'UNQUALIFIED') return 'Unqualified';
  if (u === 'CONVERTED') return 'Converted';
  return st.charAt(0).toUpperCase() + st.slice(1).toLowerCase();
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


  const [selectedLead, setSelectedLead] = useState(null);
  const [activeTab, setActiveTab] = useState('followup'); 
  const [followUpDesc, setFollowUpDesc] = useState('');
  const [nextFollowUpDate, setNextFollowUpDate] = useState('');
  const [followUpList, setFollowUpList] = useState([]);
  const [editingFollowUpId, setEditingFollowUpId] = useState(null);

  useEffect(() => {
    setLoading(true);
    getLeads()
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          const mapped = data.map((l) => {
            const displaySt = normalizeStatusDisplay(l.status);
            return {
              id: l.id,
              name: l.title || l.name ,
              contact: (typeof l.contact === 'string' ? l.contact : l.contact?.name) || l.contactName ,
              email: (typeof l.contact === 'object' ? l.contact?.email : null) || l.email ,
              phone: l.phone || (typeof l.contact === 'object' ? l.contact?.phone : null) ,
              tier: l.tier || 'Growth',
              avatarInitials: (l.title || l.name ).split(/\s+/).map((w) => w[0]).join('').substring(0, 2).toUpperCase(),
              status: displaySt,
              statusType: (l.statusType || displaySt || 'active').toLowerCase(),
              value: l.value ? (typeof l.value === 'string' && l.value.startsWith('$') ? l.value : `$${Number(l.value).toLocaleString()}`) : '$0',
              numericValue: Number(l.numericValue ?? l.value) || 0,
              source: l.source || 'Website',
              assignedTo: typeof l.assignedTo === 'string' ? l.assignedTo : (l.assignedTo?.firstName ? `${l.assignedTo.firstName} ${l.assignedTo.lastName || ''}`.trim() : 'Unassigned'),
              date: l.createdAt ? formatToMonthDateYear(l.createdAt) : '10-06-2026',
              description: `This is the description of ${l.title} Organization`,
            };
          });
          setLeadsList(mapped);
          setStored(STORAGE_KEY, mapped);
        }
      })
      .catch((err) => {
        console.warn('[Leads] API unavailable, using local data:', err.message);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (selectedLead) {
      setFollowUpList([]);
      setEditingFollowUpId(null);
      getFollowUps('lead', selectedLead.id)
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
  }, [selectedLead]);

  
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
        entityType: 'lead', 
        entityId: String(selectedLead.id),
        description: followUpDesc.trim(),
        nextFollowUpDate: nextFollowUpDate ? formatToMonthDateYear(nextFollowUpDate) : null,
        author: selectedLead.assignedTo
      };

      try {
        const saved = await createFollowUp(payload);
        setFollowUpList(prev => [saved, ...prev]);
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
      setFollowUpList(prev => prev.filter(item => item.id !== id));
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

  const openAdd = () => {
    setEditingLead(null);
    setForm(EMPTY_FORM);
    setIsModalOpen(true);
  };

  const openEdit = (lead) => {
    setEditingLead(lead);
    setForm({
      name: lead.name,
      contact: lead.contact,
      email: lead.email,
      phone: lead.phone,
      tier: lead.tier,
      numericValue: lead.numericValue || '',
      status: lead.status === 'Active' ? 'NEW' : lead.status.toUpperCase(),
      source: lead.source,
      assignedTo: lead.assignedTo
    });
    setIsModalOpen(true);
  };

  const handleClose = () => {
    setIsModalOpen(false);
    setEditingLead(null);
    setForm(EMPTY_FORM);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(p => ({ ...p, [name]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      alert('Please enter a company name.');
      return;
    }

    const numVal = Number(form.numericValue) || 0;
    const payload = {
      title: form.name.trim(),
      description: JSON.stringify({
        contact: form.contact.trim() || 'Direct Contact',
        email: form.email.trim(),
        phone: form.phone.trim(),
        tier: form.tier,
        value: numVal,
        assignedTo: form.assignedTo.trim() || 'Sarah Jenkins'
      }),
      status: form.status,
      source: form.source.toUpperCase().replace(/\s+/g, '_')
    };

    if (editingLead) {
      const displaySt = normalizeStatusDisplay(form.status);
      const optimistic = {
        ...editingLead,
        name: form.name.trim(),
        contact: form.contact.trim() || editingLead.contact,
        email: form.email.trim() || editingLead.email,
        phone: form.phone.trim() || editingLead.phone,
        tier: form.tier,
        status: displaySt,
        statusType: displaySt.toLowerCase(),
        value: numVal ? `$${numVal.toLocaleString()}` : editingLead.value,
        numericValue: numVal,
        source: form.source,
        assignedTo: form.assignedTo.trim() || editingLead.assignedTo
      };
      persist(leadsList.map(l => l.id === editingLead.id ? optimistic : l));
      if (selectedLead && selectedLead.id === editingLead.id) {
        setSelectedLead(optimistic);
      }
      try {
        const saved = await updateLead(editingLead.id, payload);
        if (saved) {
          const mappedSaved = {
            id: saved.id,
            name: saved.title || form.name.trim(),
            contact: saved.contact || form.contact.trim() || 'Direct Contact',
            email: saved.email || form.email.trim(),
            phone: saved.phone || form.phone.trim(),
            tier: saved.tier || form.tier,
            value: saved.value || (numVal ? `$${numVal.toLocaleString()}` : '$0'),
            numericValue: numVal,
            status: normalizeStatusDisplay(saved.status),
            statusType: normalizeStatusDisplay(saved.status).toLowerCase(),
          };
          setLeadsList(prev => prev.map(l => l.id === editingLead.id ? { ...l, ...mappedSaved } : l));
        }
      } catch (err) {
        console.warn('[Leads] Update API error (local state kept):', err.message);
      }
    } else {
      const displaySt = normalizeStatusDisplay(form.status);
      const lead = {
        id: `L0${leadsList.length + 1}`,
        name: form.name.trim(),
        contact: form.contact.trim(),
        email: form.email.trim() ,
        phone: form.phone.trim() ,
        tier: form.tier,
        avatarInitials: form.name.trim().split(/\s+/).map((w) => w[0]).join('').substring(0, 2).toUpperCase(),
        status: displaySt,
        statusType: displaySt.toLowerCase(),
        value: numVal ? `$${numVal.toLocaleString()}` : '$0',
        numericValue: numVal,
        source: form.source,
        assignedTo: form.assignedTo.trim() ,
        date: 'Today'
      };
      persist([lead, ...leadsList]);
      try {
        const saved = await createLead(payload);
        if (saved?.id) {
          const mappedSaved = {
            ...lead,
            id: saved.id,
            name: saved.title || lead.name,
            contact: saved.contact || lead.contact,
            value: saved.value || lead.value,
            status: normalizeStatusDisplay(saved.status),
            statusType: normalizeStatusDisplay(saved.status).toLowerCase(),
          };
          setLeadsList(prev => {
            const updated = prev.map(l => l.id === lead.id ? mappedSaved : l);
            setStored(STORAGE_KEY, updated);
            return updated;
          });
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
    if (selectedLead && selectedLead.id === id) {
      setSelectedLead(null);
    }
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
          <p className="crm-page-subtitle">Manage customer leads and pipeline prospects </p>
        </div>
        <button type="button" className="crm-banner-btn crm-btn-primary" onClick={openAdd}>
          <Plus size={16} /><span>Add Lead</span>
        </button>
      </div>

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
                      {[{ label: 'Active', value: 'NEW' },
                      { label: 'Contacted', value: 'CONTACTED' },
                      { label: 'Qualified', value: 'QUALIFIED' },
                      { label: 'Unqualified', value: 'UNQUALIFIED' },
                      { label: 'Pending', value: 'PENDING' },
                      ].map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
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

      <SidePanel
        isOpen={Boolean(selectedLead)}
        onClose={() => setSelectedLead(null)}
        title={selectedLead?.name}
        badges={
          selectedLead && (
            <>
              <span className="crm-tier-tag">{selectedLead.tier} Tier </span>
              <span style={{ fontSize: "15px", fontFamily: "arabic" }}>.   Ph No : {selectedLead.phone}</span>
            </>
          )
        }
        tabs={[
          {
            id: 'followup',
            label: 'Follow Up History',
            icon: History,
            badge: followUpList.length > 0 ? followUpList.length : null
          },
          {
            id: 'details',
            label: 'Lead Details',
            icon: Building
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
                  Add follow up Note *
                </label>
                <textarea
                  id="lead-fu-desc-input"
                  className="crm-fu-textarea"
                  placeholder="Eg : Lead is contacted and converted to Deal. "
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
                  No earlier follow-up history recorded for this lead yet.
                </div>
              )}
            </div>
          </section>
        )}

        {activeTab === 'details' && selectedLead && (
          <section className="crm-slideover-section" aria-label="Lead details">
            <div className="crm-slideover-section-header">
              <div className="crm-slideover-section-title">
                <Building size={16} />
                <span>Lead details</span>
              </div>
              {/* <span className="crm-slideover-count-pill">ID: {selectedLead.id}</span> */}
            </div>

            <div className="crm-lead-details-grid">
              <div className="crm-lead-detail-item crm-lead-detail-full">
                <span className="crm-lead-detail-label">Lead description</span>
                <p className="crm-lead-detail-desc">
                  This is the description of the selected lead.
                </p>
              </div>

              <div className="crm-lead-detail-item">
                <span className="crm-lead-detail-label">Id</span>
                <span className="crm-lead-detail-value">
                  {selectedLead.id}
                </span>
              </div>

              <div className="crm-lead-detail-item">
                <span className="crm-lead-detail-label">
                  <User size={12} /> Contact person
                </span>
                <span className="crm-lead-detail-value">{selectedLead.contact}</span>
              </div>

              <div className="crm-lead-detail-item">
                <span className="crm-lead-detail-label">
                  <Phone size={12} /> Contact Number
                </span>
                <span className="crm-lead-detail-value">{selectedLead.phone}</span>
              </div>

              <div className="crm-lead-detail-item">
                <span className="crm-lead-detail-label">
                  <Calendar size={12} /> Created date
                </span>
                <span className="crm-lead-detail-value">{selectedLead.date}</span>
              </div>

              <div className="crm-lead-detail-item">
                <span className="crm-lead-detail-label">Status</span>
                <span className="crm-lead-detail-value">
                  <span className={`crm-status-badge badge-${selectedLead.statusType || 'active'}`}>{selectedLead.status}</span>
                </span>
              </div>

              <div className="crm-lead-detail-item">
                <span className="crm-lead-detail-label">Priority</span>
                <span className="crm-lead-detail-value">
                  <span className={`crm-status-badge ${selectedLead.tier === 'Enterprise' ? 'badge-pending' : selectedLead.tier === 'Pro' ? 'badge-progress' : 'badge-active'}`}>
                    {selectedLead.tier === 'Enterprise' ? 'High' : (selectedLead.tier === 'Pro' ? 'Medium' : 'Low')}
                  </span>
                </span>
              </div>

              <div className="crm-lead-detail-item">
                <span className="crm-lead-detail-label">
                  <DollarSign size={12} /> Expected value
                </span>
                <span className="crm-lead-detail-value" style={{ color: '#059669', fontWeight: 700 }}>
                  {selectedLead.value || (selectedLead.numericValue ? `$${Number(selectedLead.numericValue).toLocaleString()}` : '$35,000')}
                </span>
              </div>

              
            </div>
          </section>
        )}
      </SidePanel>


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


      <div className="crm-card">
        <div className="crm-card-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h3 className="crm-card-title">{filter === 'All' ? 'All Leads' : `${filter} Leads`}</h3>
            <p className="crm-card-subtitle">{filteredLeads.length} leads in view</p>
          </div>
          <SearchInput
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or contact…"
            ariaLabel="Search leads"
          />
        </div>
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
                <tr
                  key={lead.id}
                  className="crm-clickable-row"
                  onClick={() => setSelectedLead(lead)}
                  title="Click to view Follow Up history & Lead details"
                >
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
                  <td onClick={(e) => e.stopPropagation()}>
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
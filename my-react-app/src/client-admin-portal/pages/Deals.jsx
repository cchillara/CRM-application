import React, { useState, useEffect } from 'react';
import { totalDeals } from '../data';
import { getStored, setStored } from '../storage';
import { Plus, X, Pencil, Trash2, Building,
  Calendar,
  User,
  DollarSign,
  History,
  Sparkles,
  CheckSquare,
  Phone,
  Check,
 } from 'lucide-react';
import { getDeals, createDeal, updateDeal, deleteDeal } from './../Api/Deals';
import "../styles/Leads.css"
import SidePanel from '../components/Side-panel';
import { getFollowUps, createFollowUp, updateFollowUp, deleteFollowUp } from '../Api/followUp';
import SearchInput from '../components/Search';

const STORAGE_KEY = 'deals';
const EMPTY_FORM = {
  title: '', company: '', contact: '', value: '',
  stage: 'Proposal', probability: '70',
  owner: 'Ravi Kiran', expectedCloseDate: new Date().toISOString().split('T')[0]
};

export default function Deals() {

  const [dealsList, setDealsList] = useState(() => getStored(STORAGE_KEY, totalDeals));
  const [selectedStage, setSelectedStage] = useState('All');
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDeal, setEditingDeal] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);


  const [selectedDeal, setselectedDeal] = useState(null);
  const [activeTab, setActiveTab] = useState('followup'); 
  const [followUpDesc, setFollowUpDesc] = useState('');
  const [nextFollowUpDate, setNextFollowUpDate] = useState('');
  const [followUpList, setFollowUpList] = useState([]);
  const [editingFollowUpId, setEditingFollowUpId] = useState(null);

  //useeffect
  useEffect(() => {
    getDeals()
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          const mapped = data.map((d) => ({
            id: d.id,
            title: d.title ,
            company:  d.company ,
            contact:  d.contact ,
            value: Number(d.value) || 0,
            stage: d.stage ? (d.stage.charAt(0).toUpperCase() + d.stage.slice(1).toLowerCase()) : 'Proposal',
            probability: d.probability !== undefined ? Number(d.probability) : 50,
            owner: d.owner,
            expectedCloseDate: d.expectedCloseDate || d.closeDate || new Date().toISOString().split('T')[0],
          }));
          persist(mapped);
        }
      })
      .catch((err) => console.warn('[Deals] API unavailable, using local data:', err.message));
  }, []);


    useEffect(() => {
      if (selectedDeal) {
        setFollowUpList([]);
        setEditingFollowUpId(null);
        getFollowUps('deal', selectedDeal.id)
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
    }, [selectedDeal]);


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
          entityType: 'deal',
          entityId: String(selectedDeal.id),
          description: followUpDesc.trim(),
          nextFollowUpDate: nextFollowUpDate ? formatToMonthDateYear(nextFollowUpDate) : null,
          author: selectedDeal?.owner || 'Sales Team'
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
            owner: selectedDeal?.owner
          };
          const updated = [newEntry, ...followUpList];
          setFollowUpList(updated);
          if (selectedDeal) {
            localStorage.setItem(`crm_deal_followups_${selectedDeal.id}`, JSON.stringify(updated));
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

  //other arrow functions 
  const persist = (updated) => { setDealsList(updated); setStored(STORAGE_KEY, updated); };
  const filteredDeals = dealsList.filter((d) => {
    const matchesStage = selectedStage === 'All' || d.stage === selectedStage;
    const q = search.toLowerCase();
    const matchesSearch = !q ||
      (d.title || '').toLowerCase().includes(q) ||
      (d.company || '').toLowerCase().includes(q) ||
      (d.contact || '').toLowerCase().includes(q);
    return matchesStage && matchesSearch;
  });
  const stageSummary = ['Qualified', 'Proposal', 'Negotiation', 'Won', 'Lost'].map(stage => {
    const stageDeals = dealsList.filter(d => d.stage === stage);
    const colors = { Qualified: '#10b981', Proposal: '#8b5cf6', Negotiation: '#f59e0b', Won: '#2563eb', Lost: '#ef4444' };
    return {
      stage, count: stageDeals.length,
      percentage: dealsList.length ? Math.round((stageDeals.length / dealsList.length) * 100) : 0,
      totalValue: stageDeals.reduce((a, d) => a + (d.value || 0), 0),
      color: colors[stage]
    };
  });



  const openAdd = () => { setEditingDeal(null); setForm(EMPTY_FORM); setIsModalOpen(true); };
  const openEdit = (deal) => {
    setEditingDeal(deal);
    setForm({
      title: deal.title, company: deal.company, contact: deal.contact, value: deal.value,
      stage: deal.stage, probability: String(deal.probability), owner: deal.owner, expectedCloseDate: deal.expectedCloseDate
    });
    setIsModalOpen(true);
  };


  const handleClose = () => { setIsModalOpen(false); setEditingDeal(null); setForm(EMPTY_FORM); };
  const handleChange = (e) => { const { name, value } = e.target; setForm(p => ({ ...p, [name]: value })); };



  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.company.trim()) { alert('Please enter Deal Title and Company Name.'); return; }
    const payload = {
      title: form.title.trim(),
      company: form.company.trim(),
      contact: form.contact.trim() ,
      value: Number(form.value) || 0,
      stage: form.stage ,
      probability: Number(form.probability) ,
      owner: form.owner ,
      expectedCloseDate: form.expectedCloseDate || new Date().toISOString().split('T')[0],
    };

    if (editingDeal) {
      const optimistic = {
        ...editingDeal, title: form.title.trim(), company: form.company.trim(),
        contact: form.contact.trim() || editingDeal.contact, value: Number(form.value) || editingDeal.value,
        stage: form.stage, probability: Number(form.probability) || editingDeal.probability,
        owner: form.owner, expectedCloseDate: form.expectedCloseDate
      };
      persist(dealsList.map(d => d.id === editingDeal.id ? optimistic : d));
      if (selectedDeal && selectedDeal.id === editingDeal.id) {
        setselectedDeal(optimistic);
      }
      try {
        const saved = await updateDeal(editingDeal.id, payload);
        if (saved) setDealsList(prev => prev.map(d => d.id === editingDeal.id ? { ...d, ...saved } : d));
      }
      catch (err) { console.warn('[Deals] Update API error:', err.message); }
    }

    else {
      const created = {
        id: `D${String(dealsList.length + 1).padStart(3, '0')}`,
        title: form.title.trim(), company: form.company.trim(), contact: form.contact.trim() || 'Primary Contact',
        value: Number(form.value) || 0, stage: form.stage || 'Proposal',
        probability: Number(form.probability) || 50, owner: form.owner || 'Ravi Kiran',
        expectedCloseDate: form.expectedCloseDate || new Date().toISOString().split('T')[0]
      };
      persist([created, ...dealsList]);
      try {
        const saved = await createDeal(payload);
        if (saved?.id) setDealsList(prev => prev.map(d => d.id === created.id ? { ...d, ...saved } : d));
      } catch (err) { console.warn('[Deals] Create API error:', err.message); }
    }
    handleClose();
  };




  const handleDelete = async (id) => {
    if (!window.confirm('Delete this deal? This cannot be undone.')) return;
    persist(dealsList.filter(d => d.id !== id));
    try { await deleteDeal(id); }
    catch (err) { console.warn('[Deals] Delete API error:', err.message); }
  };

  return (
    <div className="crm-dashboard">
      <div className="crm-top-header">
        <div>
          <h1 className="crm-page-title">Deals</h1>
          <p className="crm-page-subtitle">Track sales pipeline stages, probability, and revenue</p>
        </div>
        <button type="button" className="crm-banner-btn crm-btn-primary" onClick={openAdd}>
          <Plus size={16} /><span>New Deal</span>
        </button>
      </div>


      {isModalOpen && (
        <div className="crm-modal-backdrop" onClick={handleClose}>
          <div className="crm-modal-card" onClick={e => e.stopPropagation()}>
            <div className="crm-modal-header">
              <div>
                <h2 className="crm-modal-title">{editingDeal ? 'Edit Deal' : 'Add New Deal'}</h2>
                <p className="crm-card-subtitle" style={{ margin: 0 }}>
                  {editingDeal ? `Editing: ${editingDeal.title}` : 'Create a new sales opportunity'}
                </p>
              </div>
              <button type="button" className="crm-modal-close-btn" onClick={handleClose}><X size={18} /></button>
            </div>



            <form onSubmit={handleSave}>
              
              <div className="crm-modal-body">
                <div className="crm-form-group">
                  <label className="crm-form-label">Deal Title *</label>
                  <input type="text" name="title" value={form.title} onChange={handleChange}
                    placeholder="e.g. Cloud ERP Implementation" className="crm-form-input" required autoFocus />
                </div>


                <div className="crm-form-row">
                  <div className="crm-form-group">
                    <label className="crm-form-label">Company Name *</label>
                    <input type="text" name="company" value={form.company} onChange={handleChange}
                      placeholder="e.g. TechNova Solutions" className="crm-form-input" required />
                  </div>


                  <div className="crm-form-group">
                    <label className="crm-form-label">Contact Person</label>
                    <input type="text" name="contact" value={form.contact} onChange={handleChange}
                      placeholder="e.g. Rahul Sharma" className="crm-form-input" />
                  </div>

                </div>
                <div className="crm-form-row">
                  <div className="crm-form-group">
                    <label className="crm-form-label">Deal Value (₹)</label>
                    <input type="number" name="value" value={form.value} onChange={handleChange}
                      placeholder="e.g. 1500000" className="crm-form-input" />
                  </div>


                  <div className="crm-form-group">
                    <label className="crm-form-label">Win Probability (%)</label>
                    <input type="number" name="probability" min="0" max="100" value={form.probability}
                      onChange={handleChange} placeholder="e.g. 75" className="crm-form-input" />
                  </div>

                </div>
                <div className="crm-form-row">
                  <div className="crm-form-group">
                    <label className="crm-form-label">Pipeline Stage</label>
                    <select name="stage" value={form.stage} onChange={handleChange} className="crm-form-select">
                      {['Qualified', 'Proposal', 'Negotiation', 'Won', 'Lost'].map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>


                  <div className="crm-form-group">
                    <label className="crm-form-label">Deal Owner</label>
                    <select name="owner" value={form.owner} onChange={handleChange} className="crm-form-select">
                      {['Ravi Kiran', 'Arjun Kumar', 'Meena Patel', 'Sarah Jenkins', 'Marcus Vance'].map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>
                </div>


                <div className="crm-form-group">
                  <label className="crm-form-label">Expected Close Date</label>
                  <input type="date" name="expectedCloseDate" value={form.expectedCloseDate} onChange={handleChange} className="crm-form-input" />
                </div>
              </div>
              
              <div className="crm-modal-footer">
                <button type="button" className="crm-btn-secondary" onClick={handleClose}>Cancel</button>
                <button type="submit" className="crm-banner-btn crm-btn-primary">
                  {editingDeal ? 'Update Deal' : 'Save Deal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}


            <SidePanel
              isOpen={Boolean(selectedDeal)}
              onClose={() => setselectedDeal(null)}
              title={selectedDeal?.title}
              badges={
                selectedDeal && (
                  <>
                    <span className="crm-tier-tag">{selectedDeal.company}  </span>
                    {/* <span style={{ fontSize: "15px", fontFamily: "arabic" }}> {selectedDeal.phone}</span> */}
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
                  label: 'Deal Details',
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
                        placeholder="Eg : Deal is contacted  "
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
                              {item.owner && <span className="crm-fu-timeline-author">{item.owner}</span>}
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
                        No earlier follow-up history recorded for this deal yet.
                      </div>
                    )}
                  </div>
                </section>
              )}
      
              {activeTab === 'details' && selectedDeal && (
                <section className="crm-slideover-section" aria-label="Deal details">
                  <div className="crm-slideover-section-header">
                    <div className="crm-slideover-section-title">
                      <Building size={16} />
                      <span>Deal details</span>
                    </div>
                    {/* <span className="crm-slideover-count-pill">ID: {selectedDeal.id}</span> */}
                  </div>
      
                  <div className="crm-lead-details-grid">
                    <div className="crm-lead-detail-item crm-lead-detail-full">
                      <span className="crm-lead-detail-label">Deal description</span>
                      <p className="crm-lead-detail-desc">
                        This is the description of the selected deal.
                      </p>
                    </div>

                    <div className="crm-lead-detail-item">
                      <span className="crm-lead-detail-label">Id</span>
                      <span className="crm-lead-detail-value">
                        {selectedDeal.id}
                      </span>
                    </div>

                    <div className="crm-lead-detail-item">
                      <span className="crm-lead-detail-label">
                        <User size={12} /> Contact person
                      </span>
                      <span className="crm-lead-detail-value">{selectedDeal.contact}</span>
                    </div>

                    <div className="crm-lead-detail-item">
                      <span className="crm-lead-detail-label">
                        <User size={12} /> Assigned Owner
                      </span>
                      <span className="crm-lead-detail-value">{selectedDeal.owner}</span>
                    </div>
      
                    <div className="crm-lead-detail-item">
                      <span className="crm-lead-detail-label">
                        <Building size={12} /> Company
                      </span>
                      <span className="crm-lead-detail-value">{selectedDeal.company}</span>
                    </div>

                    <div className="crm-lead-detail-item">
                      <span className="crm-lead-detail-label">
                        <Calendar size={12} /> Expected Close Date
                      </span>
                      <span className="crm-lead-detail-value">{selectedDeal.expectedCloseDate}</span>
                    </div>

                    <div className="crm-lead-detail-item">
                      <span className="crm-lead-detail-label">
                        <User size={12} /> Probability
                      </span>
                      <span className="crm-lead-detail-value">{selectedDeal.probability }</span>
                    </div>
      
                    <div className="crm-lead-detail-item">
                      <span className="crm-lead-detail-label">Status</span>
                      <span className="crm-lead-detail-value">
                        <span className={`crm-status-badge badge-${selectedDeal.statusType}`}>{selectedDeal.stage}</span>
                      </span>
                    </div>
      
                    <div className="crm-lead-detail-item">
                      <span className="crm-lead-detail-label">
                        <DollarSign size={12} /> Expected value
                      </span>
                      <span className="crm-lead-detail-value" style={{ color: '#059669', fontWeight: 700 }}>
                        {selectedDeal.value || (selectedDeal.numericValue ? `$${Number(selectedDeal.numericValue).toLocaleString()}` : '$35,000')}
                      </span>
                    </div>
      
                    
                  </div>
                </section>
              )}
            </SidePanel>
      

      <div className="crm-kpi-grid" style={{ marginBottom: '20px' }}>
        {stageSummary.map((s) => (
          <div key={s.stage} className="crm-kpi-card"
            style={{
              borderTop: `3.5px solid ${s.color}`, cursor: 'pointer',
              outline: selectedStage === s.stage ? `2px solid ${s.color}` : 'none'
            }}
            onClick={() => setSelectedStage(selectedStage === s.stage ? 'All' : s.stage)}>
            <div className="crm-kpi-header">
              <span className="crm-kpi-title">{s.stage} Deals</span>
              <span style={{ fontSize: '12px', fontWeight: '700', color: s.color }}>{s.percentage}%</span>
            </div>
            <div className="crm-kpi-body">
              <span className="crm-kpi-value">{s.count}</span>
              <div className="crm-kpi-footer">
                <span className="crm-kpi-subtext">₹{(s.totalValue / 100000).toFixed(1)}L value</span>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="crm-card">
        <div className="crm-card-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h3 className="crm-card-title">{selectedStage === 'All' ? 'All Active Deals' : `${selectedStage} Deals`}</h3>
            <p className="crm-card-subtitle">{filteredDeals.length} deals in view</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {selectedStage !== 'All' && (
              <button type="button" className="crm-text-link-btn" onClick={() => setSelectedStage('All')}>Reset filter</button>
            )}
            <SearchInput
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search deals…"
              ariaLabel="Search deals"
            />
          </div>
        </div>
        <div className="crm-table-container">
          <table className="crm-table">
            <thead>
              <tr>
                <th>Deal Title & ID</th>
                <th>Company & Contact</th>
                <th>Deal Value</th>
                <th>Stage</th>
                <th>Probability</th>
                <th>Owner & Close Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredDeals.map((deal) => (
                <tr key={deal.id}
                 className="crm-clickable-row"
                  onClick={() => setselectedDeal(deal)}
                  title="Click to view Follow Up history & Lead details"
                >
                  <td>
                    <span className="crm-table-primary-text">{deal.title}</span>
                    <span className="crm-table-sub-text">{deal.id}</span>
                  </td>
                  <td>
                    <span className="crm-table-primary-text">{deal.company}</span>
                    <span className="crm-table-sub-text">{deal.contact}</span>
                  </td>
                  <td><strong>₹{(deal.value / 100000).toFixed(2)} Lakhs</strong></td>
                  <td>
                    <span className="crm-status-badge" style={{
                      backgroundColor: deal.stage === 'Won' ? '#ecfdf5' : deal.stage === 'Lost' ? '#fef2f2' : '#eff6ff',
                      color: deal.stage === 'Won' ? '#15803d' : deal.stage === 'Lost' ? '#b91c1c' : '#1d4ed8'
                    }}>{deal.stage}</span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '60px', height: '6px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ width: `${deal.probability}%`, height: '100%', background: deal.probability > 70 ? '#10b981' : '#f59e0b' }} />
                      </div>
                      <span style={{ fontSize: '12px', fontWeight: '600' }}>{deal.probability}%</span>
                    </div>
                  </td>
                  <td>
                    <span className="crm-table-primary-text">{deal.owner}</span>
                    <span className="crm-table-sub-text">{deal.expectedCloseDate}</span>
                  </td>
                  <td onClick={(e) => e.stopPropagation()}>
                    <div className="crm-row-actions">
                      <button type="button" className="crm-action-icon-btn" title="Edit deal" onClick={() => openEdit(deal)}>
                        <Pencil size={14} />
                      </button>
                      <button type="button" className="crm-action-icon-btn danger" title="Delete deal" onClick={() => handleDelete(deal.id)}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredDeals.length === 0 && <div className="crm-empty-state">No deals found for this stage.</div>}
        </div>
      </div>
    </div>
  );
}

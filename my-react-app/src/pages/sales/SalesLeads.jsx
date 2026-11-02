import React, { useState, useEffect, useMemo, useCallback } from "react";
import { onAuthStateChanged } from "firebase/auth";
import {
  Plus, X, Pencil, Trash2, Building, Calendar, User,
  DollarSign, History, Phone, Check,
} from "lucide-react";
import SearchInput from "../../client-admin-portal/components/Search";
import { formatToMonthDateYear } from "../../client-admin-portal/components/FormatDate";
import SidePanel from "../../client-admin-portal/components/Side-panel";
import { getFollowUps, createFollowUp, updateFollowUp, deleteFollowUp } from "../../client-admin-portal/Api/followUp";
import { auth } from "../../firebase.js";
import "../../client-admin-portal/styles/Leads.css";
import "./SalesLeads.css";

const API_BASE_URL = (import.meta.env.VITE_API_URL || "http://localhost:5000").replace(/\/$/, "");
const SALES_API_URL = `${API_BASE_URL}/api/v1/sales`;

const EMPTY_FORM = {
  name: "", contact: "", email: "", phone: "",
  tier: "Growth", numericValue: "", status: "NEW",
  source: "Website", assignedTo: "",
};

const normalizeStatusDisplay = (st) => {
  if (!st) return "Active";
  const u = String(st).toUpperCase().trim();
  if (u === "NEW" || u === "ACTIVE") return "Active";
  if (u === "PENDING") return "Pending";
  if (u === "CONTACTED") return "Contacted";
  if (u === "QUALIFIED") return "Qualified";
  if (u === "UNQUALIFIED") return "Unqualified";
  if (u === "CONVERTED") return "Converted";
  return st.charAt(0).toUpperCase() + st.slice(1).toLowerCase();
};

export default function SalesLeads() {
  const [leadsList, setLeadsList] = useState([]);
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(true);
  const [leadToDelete, setLeadToDelete] = useState(null);

  // Side panel
  const [selectedLead, setSelectedLead] = useState(null);
  const [activeTab, setActiveTab] = useState("followup");
  const [followUpDesc, setFollowUpDesc] = useState("");
  const [nextFollowUpDate, setNextFollowUpDate] = useState("");
  const [followUpList, setFollowUpList] = useState([]);
  const [editingFollowUpId, setEditingFollowUpId] = useState(null);

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    try {
      const idToken = await auth.currentUser?.getIdToken();
      const headers = {
        "Content-Type": "application/json",
        ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
      };
      const res = await fetch(`${SALES_API_URL}/leads`, { headers });
      const result = await res.json();
      const data = result.data || [];

      const mapped = data.map((l) => {
        let meta = {};
        if (l.description && l.description.startsWith("{")) {
          try { meta = JSON.parse(l.description); } catch (_) {}
        }
        const displaySt = normalizeStatusDisplay(meta.status || l.status);
        return {
          id: l.id,
          name: l.title || l.name || "Unnamed",
          contact: meta.contact || (typeof l.contact === "string" ? l.contact : l.contact?.name) || "Direct Contact",
          email: meta.email || (typeof l.contact === "object" ? l.contact?.email : null) || l.email || "",
          phone: meta.phone || l.phone || "",
          tier: meta.tier || l.tier || "Growth",
          avatarInitials: (l.title || l.name || "?").split(/\s+/).map((w) => w[0]).join("").substring(0, 2).toUpperCase(),
          status: displaySt,
          statusType: displaySt.toLowerCase(),
          value: (() => {
            const v = meta.value || l.value || 0;
            return typeof v === "string" && v.startsWith("$") ? v : `$${Number(v).toLocaleString()}`;
          })(),
          numericValue: Number(meta.value || l.numericValue || l.value) || 0,
          source: meta.source || l.source || "Website",
          assignedTo: meta.assignedTo || (typeof l.assignedTo === "string" ? l.assignedTo : l.assignedTo?.firstName ? `${l.assignedTo.firstName} ${l.assignedTo.lastName || ""}`.trim() : "Unassigned"),
          date: l.createdAt ? formatToMonthDateYear(l.createdAt) : "—",
        };
      });
      setLeadsList(mapped);
    } catch (err) {
      console.warn("[SalesLeads] fetch error:", err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => { if (user) fetchLeads(); else setLoading(false); });
    return unsub;
  }, [fetchLeads]);

  // Load follow-ups when lead selected
  useEffect(() => {
    if (selectedLead) {
      setFollowUpList([]);
      setEditingFollowUpId(null);
      setFollowUpDesc("");
      setNextFollowUpDate("");
      getFollowUps("lead", selectedLead.id)
        .then((data) => setFollowUpList(Array.isArray(data) ? data : []))
        .catch((err) => { console.warn("Follow-ups load error:", err.message); setFollowUpList([]); });
    }
  }, [selectedLead]);

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
        setFollowUpList((prev) => prev.map((f) => f.id === editingFollowUpId
          ? { ...f, description: followUpDesc.trim() }
          : f));
      }
      setEditingFollowUpId(null);
      setFollowUpDesc("");
      setNextFollowUpDate("");
    } else {
      const payload = {
        entityType: "lead",
        entityId: String(selectedLead.id),
        description: followUpDesc.trim(),
        nextFollowUpDate: nextFollowUpDate ? formatToMonthDateYear(nextFollowUpDate) : null,
        author: selectedLead.assignedTo,
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

  const handleCancelEditFollowUp = () => {
    setEditingFollowUpId(null);
    setFollowUpDesc("");
    setNextFollowUpDate("");
  };

  // Lead CRUD
  const openAdd = () => { setEditingLead(null); setForm(EMPTY_FORM); setIsModalOpen(true); };
  const openEdit = (lead) => {
    setEditingLead(lead);
    setForm({ name: lead.name, contact: lead.contact, email: lead.email, phone: lead.phone, tier: lead.tier, numericValue: lead.numericValue || "", status: lead.status === "Active" ? "NEW" : lead.status.toUpperCase(), source: lead.source, assignedTo: lead.assignedTo });
    setIsModalOpen(true);
  };
  const handleClose = () => { setIsModalOpen(false); setEditingLead(null); setForm(EMPTY_FORM); };
  const handleChange = (e) => { const { name, value } = e.target; setForm((p) => ({ ...p, [name]: value })); };

  const handleSave = async (e) => {
    e.preventDefault();
    const idToken = await auth.currentUser?.getIdToken();
    const headers = { "Content-Type": "application/json", ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}) };
    const numVal = Number(form.numericValue) || 0;
    const payload = {
      title: form.name.trim(),
      description: JSON.stringify({ contact: form.contact.trim() || "Direct Contact", email: form.email.trim(), phone: form.phone.trim(), tier: form.tier, value: numVal, assignedTo: form.assignedTo.trim() || "Unassigned", source: form.source }),
      status: form.status,
      source: form.source.toUpperCase().replace(/\s+/g, "_"),
    };
    const displaySt = normalizeStatusDisplay(form.status);
    if (editingLead) {
      const optimistic = { ...editingLead, name: form.name.trim(), contact: form.contact.trim(), email: form.email.trim(), phone: form.phone.trim(), tier: form.tier, status: displaySt, statusType: displaySt.toLowerCase(), value: numVal ? `$${numVal.toLocaleString()}` : editingLead.value, numericValue: numVal, source: form.source, assignedTo: form.assignedTo.trim() };
      setLeadsList((prev) => prev.map((l) => l.id === editingLead.id ? optimistic : l));
      if (selectedLead?.id === editingLead.id) setSelectedLead(optimistic);
      try { await fetch(`${SALES_API_URL}/leads/${editingLead.id}`, { method: "PATCH", headers, body: JSON.stringify(payload) }); } catch (err) { console.warn("Update error:", err.message); }
    } else {
      try {
        const res = await fetch(`${SALES_API_URL}/leads`, { method: "POST", headers, body: JSON.stringify(payload) });
        const saved = await res.json();
        const newLead = { id: saved?.data?.id || Date.now(), name: form.name.trim(), contact: form.contact.trim(), email: form.email.trim(), phone: form.phone.trim(), tier: form.tier, avatarInitials: form.name.trim().split(/\s+/).map((w) => w[0]).join("").substring(0, 2).toUpperCase(), status: displaySt, statusType: displaySt.toLowerCase(), value: numVal ? `$${numVal.toLocaleString()}` : "$0", numericValue: numVal, source: form.source, assignedTo: form.assignedTo.trim(), date: "Today" };
        setLeadsList((prev) => [newLead, ...prev]);
      } catch (err) { console.warn("Create error:", err.message); }
    }
    handleClose();
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this lead? This cannot be undone.")) return;
    setLeadsList((prev) => prev.filter((l) => l.id !== id));
    if (selectedLead?.id === id) setSelectedLead(null);
    try {
      const idToken = await auth.currentUser?.getIdToken();
      await fetch(`${SALES_API_URL}/leads/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${idToken}` } });
    } catch (err) { console.warn("Delete error:", err.message); }
  };

  const filteredLeads = useMemo(() => {
    return leadsList.filter((lead) => {
      const matchesFilter = filter === "All" || lead.status === filter;
      const q = search.toLowerCase();
      const matchesSearch = !q || lead.name.toLowerCase().includes(q) || (lead.contact || "").toLowerCase().includes(q);
      return matchesFilter && matchesSearch;
    });
  }, [leadsList, filter, search]);

  const statusSummary = ["Qualified", "Contacted", "Active", "Pending", "Unqualified"].map((label) => {
    const count = leadsList.filter((l) => l.status === label).length;
    return { label, count, percentage: leadsList.length ? Math.round((count / leadsList.length) * 100) : 0, color: { Qualified: "#10b981", Contacted: "#2563eb", Active: "#06b6d4", Pending: "#f59e0b", Unqualified: "#94a3b8" }[label] };
  });

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

      {/* ── Add / Edit Modal ── */}
      {isModalOpen && (
        <div className="crm-modal-backdrop" onClick={handleClose}>
          <div className="crm-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="crm-modal-header">
              <div>
                <h2 className="crm-modal-title">{editingLead ? "Edit Lead" : "Add New Lead"}</h2>
                <p className="crm-card-subtitle" style={{ margin: 0 }}>{editingLead ? `Editing: ${editingLead.name}` : "Fill in the details to add a prospect"}</p>
              </div>
              <button type="button" className="crm-modal-close-btn" onClick={handleClose}><X size={18} /></button>
            </div>
            <form onSubmit={handleSave}>
              <div className="crm-modal-body">
                <div className="crm-form-group">
                  <label className="crm-form-label">Company / Organization Name *</label>
                  <input type="text" name="name" value={form.name} onChange={handleChange} placeholder="e.g. Apex Global Systems" className="crm-form-input" required autoFocus />
                </div>
                <div className="crm-form-row">
                  <div className="crm-form-group">
                    <label className="crm-form-label">Contact Person</label>
                    <input type="text" name="contact" value={form.contact} onChange={handleChange} placeholder="e.g. Rahul Sharma" className="crm-form-input" />
                  </div>
                  <div className="crm-form-group">
                    <label className="crm-form-label">Email Address</label>
                    <input type="email" name="email" value={form.email} onChange={handleChange} placeholder="rahul@example.com" className="crm-form-input" />
                  </div>
                </div>
                <div className="crm-form-row">
                  <div className="crm-form-group">
                    <label className="crm-form-label">Phone Number</label>
                    <input type="text" name="phone" value={form.phone} onChange={handleChange} placeholder="+91 98765 43210" className="crm-form-input" />
                  </div>
                  <div className="crm-form-group">
                    <label className="crm-form-label">Expected Value ($)</label>
                    <input type="number" name="numericValue" value={form.numericValue} onChange={handleChange} placeholder="e.g. 35000" className="crm-form-input" />
                  </div>
                </div>
                <div className="crm-form-row">
                  <div className="crm-form-group">
                    <label className="crm-form-label">Tier</label>
                    <select name="tier" value={form.tier} onChange={handleChange} className="crm-form-select">
                      {["Starter", "Growth", "Pro", "Enterprise"].map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div className="crm-form-group">
                    <label className="crm-form-label">Status</label>
                    <select name="status" value={form.status} onChange={handleChange} className="crm-form-select">
                      {[{ label: "Active", value: "NEW" }, { label: "Contacted", value: "CONTACTED" }, { label: "Qualified", value: "QUALIFIED" }, { label: "Unqualified", value: "UNQUALIFIED" }, { label: "Pending", value: "PENDING" }].map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                    </select>
                  </div>
                </div>
                <div className="crm-form-row">
                  <div className="crm-form-group">
                    <label className="crm-form-label">Lead Source</label>
                    <select name="source" value={form.source} onChange={handleChange} className="crm-form-select">
                      {["Website", "LinkedIn", "Referral", "Organic", "Cold Outreach", "Social media", "Other"].map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="crm-form-group">
                    <label className="crm-form-label">Assigned To</label>
                    <input type="text" name="assignedTo" value={form.assignedTo} onChange={handleChange} placeholder="e.g. Sarah Jenkins" className="crm-form-input" />
                  </div>
                </div>
              </div>
              <div className="crm-modal-footer">
                <button type="button" className="crm-btn-secondary" onClick={handleClose}>Cancel</button>
                <button type="submit" className="crm-banner-btn crm-btn-primary">{editingLead ? "Update Lead" : "Save Lead"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Side Panel ── */}
      <SidePanel
        isOpen={Boolean(selectedLead)}
        onClose={() => setSelectedLead(null)}
        title={selectedLead?.name}
        badges={selectedLead && (
          <>
            <span className="crm-tier-tag">{selectedLead.tier} Tier</span>
            <span style={{ fontSize: "15px", fontFamily: "arabic" }}>. Ph No : {selectedLead.phone}</span>
          </>
        )}
        tabs={[
          { id: "followup", label: "Follow Up History", icon: History, badge: followUpList.length > 0 ? followUpList.length : null },
          { id: "details", label: "Lead Details", icon: Building },
        ]}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      >
        {/* ── Follow Up Tab ── */}
        {activeTab === "followup" && (
          <section className="crm-slideover-section" aria-label="Follow up history">
            <div className="crm-slideover-section-header">
              <div className="crm-slideover-section-title">
                <History size={16} /><span>Follow Up History</span>
              </div>
            </div>
            <form className="crm-fu-form-card" onSubmit={handleAddFollowUp}>
              <div className="crm-fu-form-group">
                <label className="crm-fu-form-label" htmlFor="lead-fu-desc">Add follow up Note *</label>
                <textarea id="lead-fu-desc" className="crm-fu-textarea" placeholder="Eg: Lead is contacted and converted to Deal." value={followUpDesc} onChange={(e) => setFollowUpDesc(e.target.value)} required />
              </div>
              <div className="crm-fu-form-row">
                <div className="crm-fu-form-group">
                  <label className="crm-fu-form-label" htmlFor="lead-fu-date">Next follow up date</label>
                  <input id="lead-fu-date" type="date" className="crm-fu-input-date" value={nextFollowUpDate} onChange={(e) => setNextFollowUpDate(e.target.value)} />
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
                <div className="crm-fu-empty">No earlier follow-up history recorded for this lead yet.</div>
              )}
            </div>
          </section>
        )}

        {/* ── Details Tab ── */}
        {activeTab === "details" && selectedLead && (
          <section className="crm-slideover-section" aria-label="Lead details">
            <div className="crm-slideover-section-header">
              <div className="crm-slideover-section-title"><Building size={16} /><span>Lead Details</span></div>
            </div>
            <div className="crm-lead-details-grid">
              <div className="crm-lead-detail-item crm-lead-detail-full">
                <span className="crm-lead-detail-label">Lead Description</span>
                <p className="crm-lead-detail-desc">Lead from {selectedLead.source} — assigned to {selectedLead.assignedTo}.</p>
              </div>
              <div className="crm-lead-detail-item">
                <span className="crm-lead-detail-label">ID</span>
                <span className="crm-lead-detail-value">{selectedLead.id}</span>
              </div>
              <div className="crm-lead-detail-item">
                <span className="crm-lead-detail-label"><User size={12} /> Contact Person</span>
                <span className="crm-lead-detail-value">{selectedLead.contact}</span>
              </div>
              <div className="crm-lead-detail-item">
                <span className="crm-lead-detail-label"><Phone size={12} /> Contact Number</span>
                <span className="crm-lead-detail-value">{selectedLead.phone || "—"}</span>
              </div>
              <div className="crm-lead-detail-item">
                <span className="crm-lead-detail-label"><Calendar size={12} /> Created Date</span>
                <span className="crm-lead-detail-value">{selectedLead.date}</span>
              </div>
              <div className="crm-lead-detail-item">
                <span className="crm-lead-detail-label">Status</span>
                <span className="crm-lead-detail-value">
                  <span className={`crm-status-badge badge-${selectedLead.statusType || "active"}`}>{selectedLead.status}</span>
                </span>
              </div>
              <div className="crm-lead-detail-item">
                <span className="crm-lead-detail-label">Priority</span>
                <span className="crm-lead-detail-value">
                  <span className={`crm-status-badge ${selectedLead.tier === "Enterprise" ? "badge-pending" : selectedLead.tier === "Pro" ? "badge-progress" : "badge-active"}`}>
                    {selectedLead.tier === "Enterprise" ? "High" : selectedLead.tier === "Pro" ? "Medium" : "Low"}
                  </span>
                </span>
              </div>
              <div className="crm-lead-detail-item">
                <span className="crm-lead-detail-label"><DollarSign size={12} /> Expected Value</span>
                <span className="crm-lead-detail-value" style={{ color: "#059669", fontWeight: 700 }}>
                  {selectedLead.value || `$${Number(selectedLead.numericValue).toLocaleString()}`}
                </span>
              </div>
            </div>
          </section>
        )}
      </SidePanel>

      {/* ── KPI Cards ── */}
      <div className="crm-kpi-grid" style={{ marginBottom: "20px" }}>
        {statusSummary.map((s) => (
          <div key={s.label} className="crm-kpi-card"
            style={{ borderTop: `3.5px solid ${s.color}`, cursor: "pointer", outline: filter === s.label ? `2px solid ${s.color}` : "none" }}
            onClick={() => setFilter(filter === s.label ? "All" : s.label)}>
            <div className="crm-kpi-header">
              <span className="crm-kpi-title">{s.label} Leads</span>
              <span style={{ fontSize: "12px", fontWeight: "700", color: s.color }}>{s.percentage}%</span>
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

      {/* ── Table ── */}
      <div className="crm-card">
        <div className="crm-card-header" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
          <div>
            <h3 className="crm-card-title">{filter === "All" ? "All Leads" : `${filter} Leads`}</h3>
            <p className="crm-card-subtitle">{filteredLeads.length} leads in view</p>
          </div>
          <SearchInput value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name or contact…" ariaLabel="Search leads" />
        </div>
        <div className="crm-table-container">
          <table className="crm-table">
            <thead>
              <tr>
                <th>Organization</th><th>Contact Person</th><th>Phone</th>
                <th>Tier</th><th>Expected Value</th><th>Status</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredLeads.map((lead) => (
                <tr key={lead.id} className="crm-clickable-row" onClick={() => { setSelectedLead(lead); setActiveTab("followup"); }} title="Click to view Follow Up history & Lead details">
                  <td>
                    <div className="crm-table-user-cell">
                      <div className="crm-avatar-pill">{lead.avatarInitials}</div>
                      <div>
                        <span className="crm-table-primary-text">{lead.name}</span>
                        <span className="crm-table-sub-text">{lead.id} · {lead.source}</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="crm-table-primary-text">{lead.contact}</span>
                    <span className="crm-table-sub-text">{lead.email}</span>
                  </td>
                  <td>{lead.phone || "—"}</td>
                  <td><span className="crm-tier-tag">{lead.tier}</span></td>
                  <td><strong>{lead.value}</strong></td>
                  <td><span className={`crm-status-badge badge-${lead.statusType}`}>{lead.status}</span></td>
                  <td onClick={(e) => e.stopPropagation()}>
                    <div className="crm-row-actions">
                      <button type="button" className="crm-action-icon-btn" title="Edit lead" onClick={() => openEdit(lead)}><Pencil size={14} /></button>
                      <button type="button" className="crm-action-icon-btn danger" title="Delete lead" onClick={() => handleDelete(lead.id)}><Trash2 size={14} /></button>
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

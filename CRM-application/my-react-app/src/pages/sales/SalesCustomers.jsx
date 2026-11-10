import { useCallback, useEffect, useMemo, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { Plus, Search, Pencil, Trash2, X, Building2, Mail, Phone, User, Calendar, History, Check } from "lucide-react";
import DataTable from "../../components/common/DataTable.jsx";
import StatusBadge from "../../components/common/StatusBadge.jsx";
import AddButton from "../../components/sales/AddButton.jsx";
import CustomerForm from "../../components/sales/CustomerForm.jsx";
import SidePanel from "./SidePanel.jsx";
import { getFollowUps, createFollowUp, updateFollowUp, deleteFollowUp } from "../../sales-api/followUp.js";
import { getCustomers, createCustomer, updateCustomer, deleteCustomer } from "../../sales-api/Customers.js";
import { formatToMonthDateYear } from "../../client-admin-portal/components/FormatDate";
import { auth } from "../../firebase.js";
import "../../client-admin-portal/styles/Leads.css";
import "./SalesCustomers.css";

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

const getInitials = (name) => {
  if (!name) return "?";
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
};

export default function SalesCustomers() {
  const [allCustomers, setAllCustomers] = useState([]);
  const [myCustomers, setMyCustomers] = useState([]);
  const [showCustomerForm, setShowCustomerForm] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [editForm, setEditForm] = useState({ name: "", company: "", email: "", phone: "", status: "ACTIVE" });
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [ownershipFilter, setOwnershipFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  // Side panel
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [activeTab, setActiveTab] = useState("followup");
  const [followUpDesc, setFollowUpDesc] = useState("");
  const [nextFollowUpDate, setNextFollowUpDate] = useState("");
  const [followUpList, setFollowUpList] = useState([]);
  const [editingFollowUpId, setEditingFollowUpId] = useState(null);

  const fetchCustomersData = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const [customers, assignedCustomers] = await Promise.all([
        getCustomers(),
        getCustomers("mine"),
      ]);
      setAllCustomers(Array.isArray(customers) ? customers : []);
      setMyCustomers(Array.isArray(assignedCustomers) ? assignedCustomers : []);
    } catch (error) {
      setAllCustomers([]);
      setMyCustomers([]);
      setLoadError(error.message || "Unable to load customers.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => { if (user) fetchCustomersData(); else setLoading(false); });
    return unsub;
  }, [fetchCustomersData]);

  // Load follow-ups when customer selected
  useEffect(() => {
    if (selectedCustomer) {
      setFollowUpList([]);
      setEditingFollowUpId(null);
      setFollowUpDesc("");
      setNextFollowUpDate("");
      getFollowUps("customer", selectedCustomer.id)
        .then((data) => setFollowUpList(Array.isArray(data) ? data : []))
        .catch((err) => { console.warn("Follow-ups load error:", err.message); setFollowUpList([]); });
    }
  }, [selectedCustomer]);

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
        entityType: "customer",
        entityId: String(selectedCustomer.id),
        description: followUpDesc.trim(),
        nextFollowUpDate: nextFollowUpDate ? formatToMonthDateYear(nextFollowUpDate) : null,
        author: selectedCustomer.name,
      };
      try {
        const saved = await createFollowUp(payload);
        setFollowUpList((prev) => [saved, ...prev]);
        setFollowUpDesc("");
        setNextFollowUpDate("");
      } catch (err) { alert("Failed to save follow-up: " + err.message); }
    }
  };

  const handleDeleteFollowUp = async (id) => {
    try { await deleteFollowUp(id); setFollowUpList((prev) => prev.filter((f) => f.id !== id)); }
    catch (err) { alert("Failed to delete follow-up: " + err.message); }
  };

  const handleEditFollowUp = (item) => { setEditingFollowUpId(item.id); setFollowUpDesc(item.description); setNextFollowUpDate(item.nextFollowUpDate || ""); };
  const handleCancelEditFollowUp = () => { setEditingFollowUpId(null); setFollowUpDesc(""); setNextFollowUpDate(""); };

  // Customer CRUD
  const handleCreateCustomer = async (values) => {
    try {
      const customer = await createCustomer(values);
      setAllCustomers((current) => [customer, ...current]);
      setMyCustomers((current) => [customer, ...current]);
      setShowCustomerForm(false);
    } catch (err) {
      alert("Failed to create customer: " + err.message);
    }
  };

  const openEdit = (e, customer) => {
    e.stopPropagation();
    setEditingCustomer(customer);
    setEditForm({ name: customer.name || "", company: customer.company || "", email: customer.email || "", phone: customer.phone || "", status: customer.status || "ACTIVE" });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editingCustomer) return;
    try {
      const updated = await updateCustomer(editingCustomer.id, {
        name: editForm.name.trim(),
        companyName: editForm.company.trim(),
        email: editForm.email.trim(),
        phone: editForm.phone.trim(),
        status: editForm.status,
      });
      const merge = (prev) => prev.map((c) => c.id === editingCustomer.id ? { ...c, ...updated } : c);
      setAllCustomers(merge);
      setMyCustomers(merge);
      if (selectedCustomer?.id === editingCustomer.id) setSelectedCustomer((prev) => ({ ...prev, ...updated }));
      setEditingCustomer(null);
    } catch (err) { alert("Failed to update customer: " + err.message); }
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this customer?")) return;
    try {
      await deleteCustomer(id);
      setAllCustomers((prev) => prev.filter((c) => c.id !== id));
      setMyCustomers((prev) => prev.filter((c) => c.id !== id));
      if (selectedCustomer?.id === id) setSelectedCustomer(null);
    } catch (err) { alert("Failed to delete customer: " + err.message); }
  };

  const customers = useMemo(() => {
    const query = search.trim().toLowerCase();
    const ownerCustomers = ownershipFilter === "MINE" ? myCustomers : allCustomers;
    return ownerCustomers.filter((c) => {
      const matchesSearch = !query || [c.name, c.company, c.email, c.phone].some((v) => (v || "").toLowerCase().includes(query));
      return matchesSearch && (statusFilter === "ALL" || c.status === statusFilter);
    });
  }, [allCustomers, myCustomers, ownershipFilter, search, statusFilter]);

  const activeCount = allCustomers.filter((c) => c.status === "ACTIVE").length;
  const now = new Date();
  const newThisMonthCount = allCustomers.filter((c) => { const d = new Date(c.createdAt); return !Number.isNaN(d.getTime()) && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear(); }).length;
  const summary = [{ label: "Total Customers", value: allCustomers.length }, { label: "Active Customers", value: activeCount }, { label: "New This Month", value: newThisMonthCount }];

  return (
    <div className="crm-dashboard">
      <div className="crm-top-header">
        <div>
          <h1 className="crm-page-title">Customers</h1>
          <p className="crm-page-subtitle">Manage your customer relationships and accounts.</p>
        </div>
        <button type="button" className="crm-banner-btn crm-btn-primary" onClick={() => setShowCustomerForm(true)}>
          <Plus size={16} /><span>Add Customer</span>
        </button>
      </div>

      {/* KPI Summary */}
      <div className="crm-kpi-grid" style={{ marginBottom: "20px" }}>
        {summary.map((item) => (
          <div key={item.label} className="crm-kpi-card">
            <div className="crm-kpi-header"><span className="crm-kpi-title">{item.label}</span></div>
            <div className="crm-kpi-body"><span className="crm-kpi-value">{loading ? "…" : item.value}</span></div>
          </div>
        ))}
      </div>

      {/* ── Side Panel ── */}
      <SidePanel
        isOpen={Boolean(selectedCustomer)}
        onClose={() => setSelectedCustomer(null)}
        title={selectedCustomer?.company || selectedCustomer?.name}
        badges={selectedCustomer && (
          <span className={`crm-status-badge badge-${selectedCustomer.status === "ACTIVE" ? "active" : "inactive"}`}>{selectedCustomer.status}</span>
        )}
        headerActions={selectedCustomer && (
          <button type="button" className="crm-action-icon-btn" title="Edit" onClick={(e) => openEdit(e, selectedCustomer)}><Pencil size={15} /></button>
        )}
        tabs={[
          { id: "followup", label: "Follow Up History", icon: History, badge: followUpList.length > 0 ? followUpList.length : null },
          { id: "details", label: "Customer Details", icon: Building2 },
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
                <label className="crm-fu-form-label" htmlFor="cust-fu-desc">Add follow up Note *</label>
                <textarea id="cust-fu-desc" className="crm-fu-textarea" placeholder="Eg: Customer renewed contract for another year." value={followUpDesc} onChange={(e) => setFollowUpDesc(e.target.value)} required />
              </div>
              <div className="crm-fu-form-row">
                <div className="crm-fu-form-group">
                  <label className="crm-fu-form-label" htmlFor="cust-fu-date">Next follow up date</label>
                  <input id="cust-fu-date" type="date" className="crm-fu-input-date" value={nextFollowUpDate} onChange={(e) => setNextFollowUpDate(e.target.value)} />
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
                        <Calendar size={12} /><span>Next Follow-up: <strong>{item.nextFollowUpDate}</strong></span>
                      </div>
                    )}
                  </div>
                </div>
              )) : (
                <div className="crm-fu-empty">No earlier follow-up history recorded for this customer yet.</div>
              )}
            </div>
          </section>
        )}

        {/* ── Details Tab ── */}
        {activeTab === "details" && selectedCustomer && (
          <section className="crm-slideover-section" aria-label="Customer details">
            <div className="crm-slideover-section-header">
              <div className="crm-slideover-section-title"><Building2 size={16} /><span>Customer Details</span></div>
            </div>
            <div className="crm-lead-details-grid">
              <div className="crm-lead-detail-item crm-lead-detail-full">
                <span className="crm-lead-detail-label">Customer ID</span>
                <span className="crm-lead-detail-value">{selectedCustomer.id}</span>
              </div>
              <div className="crm-lead-detail-item">
                <span className="crm-lead-detail-label"><User size={12} /> Contact Person</span>
                <span className="crm-lead-detail-value">{selectedCustomer.name}</span>
              </div>
              <div className="crm-lead-detail-item">
                <span className="crm-lead-detail-label"><Building2 size={12} /> Company</span>
                <span className="crm-lead-detail-value">{selectedCustomer.company}</span>
              </div>
              <div className="crm-lead-detail-item">
                <span className="crm-lead-detail-label"><Mail size={12} /> Email</span>
                <span className="crm-lead-detail-value">{selectedCustomer.email || "—"}</span>
              </div>
              <div className="crm-lead-detail-item">
                <span className="crm-lead-detail-label"><Phone size={12} /> Phone</span>
                <span className="crm-lead-detail-value">{selectedCustomer.phone || "—"}</span>
              </div>
              <div className="crm-lead-detail-item">
                <span className="crm-lead-detail-label">Status</span>
                <span className="crm-lead-detail-value">
                  <span className={`crm-status-badge badge-${selectedCustomer.status === "ACTIVE" ? "active" : "inactive"}`}>{selectedCustomer.status}</span>
                </span>
              </div>
              <div className="crm-lead-detail-item">
                <span className="crm-lead-detail-label"><Calendar size={12} /> Last Contact</span>
                <span className="crm-lead-detail-value">{formatDate(selectedCustomer.lastContact)}</span>
              </div>
              <div className="crm-lead-detail-item">
                <span className="crm-lead-detail-label"><Calendar size={12} /> Customer Since</span>
                <span className="crm-lead-detail-value">{formatDate(selectedCustomer.createdAt)}</span>
              </div>
              {selectedCustomer.contacts && selectedCustomer.contacts.length > 1 && (
                <div className="crm-lead-detail-item crm-lead-detail-full">
                  <span className="crm-lead-detail-label">All Contacts</span>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "4px" }}>
                    {selectedCustomer.contacts.map((contact, idx) => (
                      <div key={idx} style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "8px", padding: "8px 12px" }}>
                        <div style={{ fontWeight: 600, fontSize: "13px" }}>{contact.name}</div>
                        {contact.email && <div style={{ fontSize: "12px", color: "#64748b" }}>{contact.email}</div>}
                        {contact.phone && <div style={{ fontSize: "12px", color: "#64748b" }}>{contact.phone}</div>}
                        {contact.jobTitle && <div style={{ fontSize: "12px", color: "#94a3b8" }}>{contact.jobTitle}</div>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>
        )}
      </SidePanel>

      {/* ── Table ── */}
      <div className="crm-card">
        <div className="crm-card-header" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
          <div>
            <div style={{ display: "flex", gap: "8px" }}>
              {["ALL", "MINE"].map((f) => (
                <button key={f} type="button" className={`crm-btn-secondary${ownershipFilter === f ? " active" : ""}`} style={{ padding: "6px 16px", fontSize: "13px", fontWeight: ownershipFilter === f ? 600 : 400 }} onClick={() => setOwnershipFilter(f)}>
                  {f === "ALL" ? "All Customers" : "My Customers"}
                </button>
              ))}
            </div>
          </div>
          <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
            <div className="crm-search-wrapper" style={{ display: "flex", alignItems: "center", gap: "8px", background: "#f1f5f9", borderRadius: "8px", padding: "6px 12px" }}>
              <Search size={15} style={{ color: "#94a3b8" }} />
              <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search customers" style={{ border: "none", background: "transparent", outline: "none", fontSize: "13px" }} />
            </div>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="crm-form-select" style={{ width: "auto" }}>
              <option value="ALL">All statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>
        </div>

        {loadError && <p style={{ color: "#dc2626", padding: "12px 16px" }}>{loadError}</p>}
        {loading && <p style={{ color: "#64748b", padding: "12px 16px" }}>Loading customers…</p>}

        <div className="crm-table-container">
          <table className="crm-table">
            <thead>
              <tr>
                <th>Customer</th><th>Company</th><th>Email</th>
                <th>Phone</th><th>Status</th><th>Last Contact</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((customer) => (
                <tr key={customer.id} className="crm-clickable-row" onClick={() => { setSelectedCustomer(customer); setActiveTab("followup"); }} title="Click to view Follow Up history & Customer details">
                  <td>
                    <div className="crm-table-user-cell">
                      <div className="crm-avatar-pill">{getInitials(customer.name)}</div>
                      <span className="crm-table-primary-text">{customer.name}</span>
                    </div>
                  </td>
                  <td><span className="crm-table-primary-text">{customer.company}</span></td>
                  <td><span className="crm-table-sub-text">{customer.email}</span></td>
                  <td><span className="crm-table-sub-text">{customer.phone}</span></td>
                  <td><span className={`crm-status-badge badge-${customer.status === "ACTIVE" ? "active" : "inactive"}`}>{customer.status}</span></td>
                  <td><span className="crm-table-sub-text">{formatDate(customer.lastContact)}</span></td>
                  <td onClick={(e) => e.stopPropagation()}>
                    <div className="crm-row-actions">
                      <button type="button" className="crm-action-icon-btn" title="Edit" onClick={(e) => openEdit(e, customer)}><Pencil size={14} /></button>
                      <button type="button" className="crm-action-icon-btn danger" title="Delete" onClick={(e) => handleDelete(e, customer.id)}><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {customers.length === 0 && !loading && <div className="crm-empty-state">No customers match your search or filters.</div>}
        </div>
      </div>

      {/* Edit Customer Modal */}
      {editingCustomer && (
        <div className="crm-modal-backdrop" onClick={() => setEditingCustomer(null)}>
          <div className="crm-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="crm-modal-header">
              <h3 className="crm-modal-title">Edit Customer</h3>
              <button type="button" className="crm-modal-close-btn" onClick={() => setEditingCustomer(null)}><X size={18} /></button>
            </div>
            <form onSubmit={handleEditSubmit}>
              <div className="crm-modal-body">
                <div className="crm-form-group">
                  <label className="crm-form-label">Contact Person Name</label>
                  <input type="text" required className="crm-form-input" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
                </div>
                <div className="crm-form-group">
                  <label className="crm-form-label">Company Name</label>
                  <input type="text" required className="crm-form-input" value={editForm.company} onChange={(e) => setEditForm({ ...editForm, company: e.target.value })} />
                </div>
                <div className="crm-form-row">
                  <div className="crm-form-group">
                    <label className="crm-form-label">Email Address</label>
                    <input type="email" className="crm-form-input" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} />
                  </div>
                  <div className="crm-form-group">
                    <label className="crm-form-label">Phone Number</label>
                    <input type="tel" className="crm-form-input" value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} />
                  </div>
                </div>
                <div className="crm-form-group">
                  <label className="crm-form-label">Status</label>
                  <select className="crm-form-select" value={editForm.status} onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}>
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                  </select>
                </div>
              </div>
              <div className="crm-modal-footer">
                <button type="button" className="crm-btn-secondary" onClick={() => setEditingCustomer(null)}>Cancel</button>
                <button type="submit" className="crm-banner-btn crm-btn-primary">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showCustomerForm && <CustomerForm onClose={() => setShowCustomerForm(false)} onSubmit={handleCreateCustomer} />}
    </div>
  );
}

import { useState, useEffect } from "react";
import { auth } from "../../firebase.js";
import { onAuthStateChanged } from "firebase/auth";
import { Plus, Search, Trash2, Pencil, Tag, DollarSign, CalendarDays, History, Check, Calendar, X } from "lucide-react";
import ConfirmDialog from "../../components/common/ConfirmDialog.jsx";
import DataTable from "../../components/common/DataTable.jsx";
import StatusBadge from "../../components/common/StatusBadge.jsx";
import AddButton from "../../components/sales/AddButton.jsx";
import ProductForm from "../../components/sales/ProductForm.jsx";
import SidePanel from "./SidePanel.jsx";
import { getFollowUps, createFollowUp, updateFollowUp, deleteFollowUp } from "../../sales-api/followUp.js";
import { getProducts, createProduct, updateProduct, deleteProduct as apiDeleteProduct } from "../../sales-api/Products.js";
import { formatToMonthDateYear } from "../../client-admin-portal/components/FormatDate";
import "../../client-admin-portal/styles/Leads.css";
import "./SalesProducts.css";

export default function SalesProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [formProduct, setFormProduct] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);

  // Side panel
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [activeTab, setActiveTab] = useState("followup");
  const [followUpDesc, setFollowUpDesc] = useState("");
  const [nextFollowUpDate, setNextFollowUpDate] = useState("");
  const [followUpList, setFollowUpList] = useState([]);
  const [editingFollowUpId, setEditingFollowUpId] = useState(null);

  const fetchProductsData = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getProducts();
      setProducts(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Failed to load products.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => { if (user) fetchProductsData(); else setLoading(false); });
    return unsub;
  }, []);

  // Load follow-ups when product selected
  useEffect(() => {
    if (selectedProduct) {
      setFollowUpList([]);
      setEditingFollowUpId(null);
      setFollowUpDesc("");
      setNextFollowUpDate("");
      getFollowUps("product", selectedProduct.id)
        .then((data) => setFollowUpList(Array.isArray(data) ? data : []))
        .catch((err) => { console.warn("Follow-ups load error:", err.message); setFollowUpList([]); });
    }
  }, [selectedProduct]);

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
        entityType: "product",
        entityId: String(selectedProduct.id),
        description: followUpDesc.trim(),
        nextFollowUpDate: nextFollowUpDate ? formatToMonthDateYear(nextFollowUpDate) : null,
        author: "Product Team",
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

  const query = search.trim().toLowerCase();
  const visibleProducts = products.filter((p) => {
    const matchesSearch = !query || `${p.name} ${p.code}`.toLowerCase().includes(query);
    const matchesStatus = statusFilter === "ALL" || p.status === statusFilter;
    const matchesCategory = categoryFilter === "ALL" || p.category === categoryFilter;
    return matchesSearch && matchesStatus && matchesCategory;
  });
  const categories = [...new Set(products.map((p) => p.category))];

  const formatPrice = (p) => new Intl.NumberFormat("en-US", { style: "currency", currency: p.currency || "INR" }).format(Number(p.price) || 0);

  const saveProduct = async (values) => {
    if (formProduct) {
      setProducts((curr) => curr.map((p) => p.id === formProduct.id ? { ...p, ...values } : p));
      if (selectedProduct?.id === formProduct.id) setSelectedProduct((prev) => ({ ...prev, ...values }));
    } else {
      setProducts((curr) => [{ id: `product-${Date.now()}`, ...values }, ...curr]);
    }
    setShowForm(false);
    setFormProduct(null);
  };

  const deleteProduct = async () => {
    if (selectedProduct?.id === productToDelete?.id) setSelectedProduct(null);
    setProducts((curr) => curr.filter((p) => p.id !== productToDelete.id));
    setProductToDelete(null);
  };

  return (
    <div className="crm-dashboard">
      <div className="crm-top-header">
        <div>
          <h1 className="crm-page-title">Products</h1>
          <p className="crm-page-subtitle">Manage the products and services your organisation offers to customers.</p>
        </div>
        <button type="button" className="crm-banner-btn crm-btn-primary" onClick={() => { setFormProduct(null); setShowForm(true); }}>
          <Plus size={16} /><span>Add Product</span>
        </button>
      </div>

      {loading && <p style={{ color: "#64748b", padding: "12px 0" }}>Loading products…</p>}
      {error && <p style={{ color: "#dc2626", padding: "12px 0" }} role="alert">{error}</p>}

      {/* ── Side Panel ── */}
      <SidePanel
        isOpen={Boolean(selectedProduct)}
        onClose={() => setSelectedProduct(null)}
        title={selectedProduct?.name}
        badges={selectedProduct && (
          <span className={`crm-status-badge badge-${selectedProduct.status === "ACTIVE" ? "active" : "inactive"}`}>{selectedProduct.status}</span>
        )}
        headerActions={selectedProduct && (
          <button type="button" className="crm-action-icon-btn" title="Edit" onClick={(e) => { e.stopPropagation(); setFormProduct(selectedProduct); setShowForm(true); }}>
            <Pencil size={15} />
          </button>
        )}
        tabs={[
          { id: "followup", label: "Follow Up History", icon: History, badge: followUpList.length > 0 ? followUpList.length : null },
          { id: "details", label: "Product Details", icon: Tag },
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
                <label className="crm-fu-form-label" htmlFor="prod-fu-desc">Add follow up Note *</label>
                <textarea id="prod-fu-desc" className="crm-fu-textarea" placeholder="Eg: Product demo scheduled with client." value={followUpDesc} onChange={(e) => setFollowUpDesc(e.target.value)} required />
              </div>
              <div className="crm-fu-form-row">
                <div className="crm-fu-form-group">
                  <label className="crm-fu-form-label" htmlFor="prod-fu-date">Next follow up date</label>
                  <input id="prod-fu-date" type="date" className="crm-fu-input-date" value={nextFollowUpDate} onChange={(e) => setNextFollowUpDate(e.target.value)} />
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
                <div className="crm-fu-empty">No earlier follow-up history recorded for this product yet.</div>
              )}
            </div>
          </section>
        )}

        {/* ── Details Tab ── */}
        {activeTab === "details" && selectedProduct && (
          <section className="crm-slideover-section" aria-label="Product details">
            <div className="crm-slideover-section-header">
              <div className="crm-slideover-section-title"><Tag size={16} /><span>Product Details</span></div>
            </div>
            <div className="crm-lead-details-grid">
              <div className="crm-lead-detail-item crm-lead-detail-full">
                <span className="crm-lead-detail-label">Product Name</span>
                <span className="crm-lead-detail-value">{selectedProduct.name}</span>
              </div>
              <div className="crm-lead-detail-item">
                <span className="crm-lead-detail-label"><Tag size={12} /> Code</span>
                <span className="crm-lead-detail-value">{selectedProduct.code || selectedProduct.productId || "—"}</span>
              </div>
              <div className="crm-lead-detail-item">
                <span className="crm-lead-detail-label"><Tag size={12} /> Category</span>
                <span className="crm-lead-detail-value">{selectedProduct.category}</span>
              </div>
              <div className="crm-lead-detail-item">
                <span className="crm-lead-detail-label"><DollarSign size={12} /> Price</span>
                <span className="crm-lead-detail-value" style={{ color: "#059669", fontWeight: 700 }}>{formatPrice(selectedProduct)}</span>
              </div>
              <div className="crm-lead-detail-item">
                <span className="crm-lead-detail-label"><CalendarDays size={12} /> Billing</span>
                <span className="crm-lead-detail-value">{selectedProduct.billing || "—"}</span>
              </div>
              <div className="crm-lead-detail-item">
                <span className="crm-lead-detail-label">Status</span>
                <span className="crm-lead-detail-value">
                  <span className={`crm-status-badge badge-${selectedProduct.status === "ACTIVE" ? "active" : "inactive"}`}>{selectedProduct.status}</span>
                </span>
              </div>
              {selectedProduct.description && (
                <div className="crm-lead-detail-item crm-lead-detail-full">
                  <span className="crm-lead-detail-label">Description</span>
                  <p className="crm-lead-detail-desc">{selectedProduct.description}</p>
                </div>
              )}
            </div>
          </section>
        )}
      </SidePanel>

      {/* ── Products Table ── */}
      <div className="crm-card">
        <div className="crm-card-header" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
          <div>
            <h3 className="crm-card-title">Product Catalogue</h3>
            <p className="crm-card-subtitle">{visibleProducts.length} products in view</p>
          </div>
          <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "#f1f5f9", borderRadius: "8px", padding: "6px 12px" }}>
              <Search size={15} style={{ color: "#94a3b8" }} />
              <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search products" style={{ border: "none", background: "transparent", outline: "none", fontSize: "13px" }} />
            </div>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="crm-form-select" style={{ width: "auto" }}>
              <option value="ALL">All statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
            <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="crm-form-select" style={{ width: "auto" }}>
              <option value="ALL">All categories</option>
              {categories.map((cat) => <option key={cat}>{cat}</option>)}
            </select>
          </div>
        </div>
        <div className="crm-table-container">
          <table className="crm-table">
            <thead>
              <tr>
                <th>Product</th><th>Product Name</th><th>Category</th>
                <th>Base Pricing</th><th>Status</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {visibleProducts.map((p) => (
                <tr key={p.id} className="crm-clickable-row" onClick={() => { setSelectedProduct(p); setActiveTab("followup"); }} title="Click to view Follow Up history & Product details">
                  <td><span className="crm-table-primary-text">{p.code || p.productId || p.id}</span></td>
                  <td>
                    <div className="crm-table-user-cell">
                      <div className="crm-avatar-pill" style={{ backgroundColor: "#f5f3ff", color: "#7c3aed", fontSize: "11px" }}>
                        {(p.name || "P").split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <span className="crm-table-primary-text">{p.name}</span>
                        <span className="crm-table-sub-text">{p.description?.slice(0, 40)}{p.description?.length > 40 ? "…" : ""}</span>
                      </div>
                    </div>
                  </td>
                  <td><span className="crm-table-sub-text">{p.category}</span></td>
                  <td><strong>{formatPrice(p)}</strong></td>
                  <td><span className={`crm-status-badge ${p.status === "ACTIVE" ? "badge-active" : p.status === "Draft" ? "badge-progress" : "badge-pending"}`}>{p.status}</span></td>
                  <td onClick={(e) => e.stopPropagation()}>
                    <div className="crm-row-actions">
                      <button type="button" className="crm-action-icon-btn" title="Edit" onClick={(e) => { e.stopPropagation(); setFormProduct(p); setShowForm(true); }}><Pencil size={14} /></button>
                      <button type="button" className="crm-action-icon-btn danger" title="Delete" onClick={(e) => { e.stopPropagation(); setProductToDelete(p); }}><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {visibleProducts.length === 0 && <div className="crm-empty-state">{products.length ? "No products match your search or filters." : "No products have been added yet."}</div>}
        </div>
      </div>

      {showForm && <ProductForm product={formProduct} onClose={() => setShowForm(false)} onSubmit={saveProduct} />}
      {productToDelete && <ConfirmDialog title="Delete product?" message={`Are you sure you want to delete "${productToDelete.name}"? This action cannot be undone.`} onCancel={() => setProductToDelete(null)} onConfirm={deleteProduct} confirmLabel="Delete Product" />}
    </div>
  );
}

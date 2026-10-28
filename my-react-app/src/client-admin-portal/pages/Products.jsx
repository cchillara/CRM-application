import React, { useState, useEffect } from 'react';
import { productsList } from '../data';
import { getStored, setStored } from '../storage';
import { Package, 
  Plus,
  X,
  Pencil, 
  Trash2,
  Building,
  Calendar,
  Tags,
  DollarSign,
  History,
  Sparkles,
  CheckSquare,
  CalendarDays,
  Check } from 'lucide-react';
import { getProducts, createProduct, updateProduct, deleteProduct } from '../Api/Product';
import { getFollowUps, createFollowUp, updateFollowUp, deleteFollowUp } from '../Api/followUp';
import { formatToMonthDateYear } from '../components/FormatDate';
import SidePanel from '../components/Side-panel';
import "../styles/Leads.css"

const STORAGE_KEY = 'products';
const EMPTY_FORM = { name: '', category: 'Software & SaaS', organizationName : '' , price: '₹50,000 ', billing: 'Annual Billing', inventory: 'Standard Tier · 10 Seats', status: 'Active' };
const CATEGORIES = ['Software & SaaS', 'Cloud Services', 'AI & Intelligence', 'Integration', 'Customer Support', 'Professional Services'];

export default function Products() {
  const [products, setProducts] = useState(() => getStored(STORAGE_KEY, productsList));
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const persist = (updated) => { setProducts(updated); setStored(STORAGE_KEY, updated); };


    const [selectedProduct, setselectedProduct] = useState(null);
    const [activeTab, setActiveTab] = useState('followup'); 
    const [followUpDesc, setFollowUpDesc] = useState('');
    const [nextFollowUpDate, setNextFollowUpDate] = useState('');
    const [followUpList, setFollowUpList] = useState([]);
    const [editingFollowUpId, setEditingFollowUpId] = useState(null);

  useEffect(() => {
    getProducts()
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          const mapped = data.map((p) => ({
            id: p.id,
            name: p.name ,
            category: p.category ,
            organizationName : p.organizationName,
            price: p.price ? (String(p.price).startsWith('₹') ? p.price : `₹${Number(p.price).toLocaleString()} `) : '₹0 ',
            billing: p.billing ,
            inventory: p.inventory ,
            status: p.status === 'Active' ? 'Active' : 'Inactive',
          }));
          persist(mapped);
        }
      })
      .catch((err) => console.warn('[Products] API unavailable, using local data:', err.message));
  }, []);

  useEffect(() => {
    if (selectedProduct) {
      setFollowUpList([]);
      setEditingFollowUpId(null);
      getFollowUps('product', selectedProduct.id)
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
  }, [selectedProduct]);

  
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
        entityType: 'product',
        entityId: String(selectedProduct.id),
        description: followUpDesc.trim(),
        nextFollowUpDate: nextFollowUpDate ? formatToMonthDateYear(nextFollowUpDate) : null,
        author: 'Product Team'
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
        };
        const updated = [newEntry, ...followUpList];
        setFollowUpList(updated);
        if (selectedProduct) {
          localStorage.setItem(`crm_product_followups_${selectedProduct.id}`, JSON.stringify(updated));
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
    setFollowUpDesc(item.description);
    setEditingFollowUpId(item.id);
    setNextFollowUpDate(item.nextFollowUpDate || '');
  };

  const handleCancelEditFollowUp = () => {
    setEditingFollowUpId(null);
    setFollowUpDesc('');
    setNextFollowUpDate('');
  };


  const openAdd = () => { setEditingProduct(null); setForm(EMPTY_FORM); setIsModalOpen(true); };
  const openEdit = (p) => {
    setEditingProduct(p);
    setForm({ name: p.name, category: p.category, organizationName : p.organizationName, price: p.price, billing: p.billing, inventory: p.inventory, status: p.status });
    setIsModalOpen(true);
  };

  const handleClose = () => { setIsModalOpen(false); setEditingProduct(null); setForm(EMPTY_FORM); };
  const handleChange = (e) => { const { name, value } = e.target; setForm(p => ({ ...p, [name]: value })); };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { alert('Please enter a product name.'); return; }
    const payload = {
      name: form.name.trim(),
      category: form.category,
      organizationName : form.organizationName.trim(),
      price: form.price.trim(),
      billing: form.billing,
      inventory: form.inventory.trim(),
      status: form.status
    };
    if (editingProduct) {
      const optimistic = { ...editingProduct, ...payload };
      persist(products.map(p => p.id === editingProduct.id ? optimistic : p));
      if (selectedProduct && selectedProduct.id === editingProduct.id) {
        setselectedProduct(optimistic);
      }
      try {
        const saved = await updateProduct(editingProduct.id, payload);
        if (saved) setProducts(prev => prev.map(p => p.id === editingProduct.id ? { ...p, ...saved } : p));
      }
      catch (err) { console.warn('[Products] Update API error:', err.message); }
    } else {
      const created = {
        id: `PRD-${String(products.length + 1).padStart(3, '0')}`,
        ...payload
      };
      persist([created, ...products]);
      try {
        const saved = await createProduct(payload);
        if (saved?.id) {
          persist([saved, ...products.filter(p => p.id !== created.id)]);
        }
      } catch (err) { console.warn('[Products] Create API error:', err.message); }
    }
    handleClose();
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Remove this product from catalog?')) return;
    persist(products.filter(p => p.id !== id));
    try { await deleteProduct(id); }
    catch (err) { console.warn('[Products] Delete API error:', err.message); }
  };

  return (
    <div className="crm-dashboard">
      <div className="crm-top-header">
        <div>
          <h1 className="crm-page-title">Products & Services</h1>
          <p className="crm-page-subtitle">Product catalogue, solution packaging, and service offerings</p>
        </div>
        <button type="button" className="crm-banner-btn crm-btn-primary" onClick={openAdd}>
          <Plus size={16} /><span>Add Product</span>
        </button>
      </div>

      {isModalOpen && (
        <div className="crm-modal-backdrop" onClick={handleClose}>
          <div className="crm-modal-card" onClick={e => e.stopPropagation()}>
            <div className="crm-modal-header">
              <div>
                <h2 className="crm-modal-title">{editingProduct ? 'Edit Product' : 'Add New Product'}</h2>
                <p className="crm-card-subtitle" style={{ margin: 0 }}>
                  {editingProduct ? `Editing: ${editingProduct.id}` : 'Add a product or service to catalog'}
                </p>
              </div>
              <button type="button" className="crm-modal-close-btn" onClick={handleClose}><X size={18} /></button>
            </div>
            <form onSubmit={handleSave}>
              <div className="crm-modal-body">
                <div className="crm-form-group">
                  <label className="crm-form-label">Product Name *</label>
                  <input type="text" name="name" value={form.name} onChange={handleChange}
                    placeholder="e.g. AI Customer Insights Suite" className="crm-form-input" required autoFocus />
                </div>
                <div className="crm-form-row">
                  <div className="crm-form-group">
                    <label className="crm-form-label">Category</label>
                    <select name="category" value={form.category} onChange={handleChange} className="crm-form-select">
                      {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="crm-form-group">
                    <label className="crm-form-label">Base Pricing</label>
                    <input type="text" name="price" value={form.price} onChange={handleChange}
                      placeholder="e.g. ₹60,000 " className="crm-form-input" />
                  </div>
                </div>
                <div className="crm-form-row">
                  <div className="crm-form-group">
                    <label className="crm-form-label">Billing Model</label>
                    <select name="billing" value={form.billing} onChange={handleChange} className="crm-form-select">
                      {['Annual Billing', 'Monthly Billing', 'Quarterly Billing', 'One-Time'].map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                  </div>
                  <div className="crm-form-group">
                    <label className="crm-form-label">Catalog Status</label>
                    <select name="status" value={form.status} onChange={handleChange} className="crm-form-select">
                      {['Active', 'Draft', 'Discontinued'].map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
                <div className="crm-form-group">
                  <label className="crm-form-label">Organization </label>
                  <input type="text" name="organizationName" value={form.organizationName} onChange={handleChange}
                    placeholder="Eg : Name of the organization" />
                </div>
              </div>
              <div className="crm-modal-footer">
                <button type="button" className="crm-btn-secondary" onClick={handleClose}>Cancel</button>
                <button type="submit" className="crm-banner-btn crm-btn-primary">
                  {editingProduct ? 'Update Product' : 'Save Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      <SidePanel
        isOpen={Boolean(selectedProduct)}
        onClose={() => setselectedProduct(null)}
        title={selectedProduct?.name}
        badges={
          selectedProduct && (
            <>
              {/* <span className="crm-tier-tag">{selectedProduct.tier} Tier </span> */}
              <span style={{ fontSize: "15px", fontFamily: "arabic" }}>{selectedProduct.organizationName}</span>
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
            label: 'Product Details',
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
                    placeholder="Eg : Product is in development phase. "
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
                    No earlier follow-up history recorded for this product yet.
                  </div>
                )}
              </div>
            </section>
        )}

        {activeTab === 'details' && selectedProduct && (
          <section className="crm-slideover-section" aria-label="Product details">
            <div className="crm-slideover-section-header">
              <div className="crm-slideover-section-title">
                <Building size={16} />
                <span>Product details</span>
              </div>
              {/* <span className="crm-slideover-count-pill">ID: {selectedProduct.id}</span> */}
            </div>

            <div className="crm-lead-details-grid">
              <div className="crm-lead-detail-item crm-lead-detail-full">
                <span className="crm-lead-detail-label">Product description</span>
                <p className="crm-lead-detail-desc">
                  This is the description of the selected product.
                </p>
              </div>
              
              <div className="crm-lead-detail-item">
                <span className="crm-lead-detail-label">Id</span>
                <span className="crm-lead-detail-value">
                  {selectedProduct.id}
                </span>
              </div>
              <div className="crm-lead-detail-item">
                <span className="crm-lead-detail-label">
                  <Tags size={12} /> Category
                </span>
                <span className="crm-lead-detail-value">{selectedProduct.category}</span>
              </div>

              <div className="crm-lead-detail-item">
                <span className="crm-lead-detail-label">
                  <CalendarDays size={12} /> Billing Cycle
                </span>
                <span className="crm-lead-detail-value">{selectedProduct.billing}</span>
              </div>

              <div className="crm-lead-detail-item">
                <span className="crm-lead-detail-label">Status</span>
                <span className="crm-lead-detail-value">
                  <span className={`crm-status-badge badge-${selectedProduct.statusType || 'active'}`}>{selectedProduct.status}</span>
                </span>
              </div>

              <div className="crm-lead-detail-item">
                <span className="crm-lead-detail-label">Priority</span>
                <span className="crm-lead-detail-value">
                  <span className={`crm-status-badge ${selectedProduct.tier === 'Enterprise' ? 'badge-pending' : selectedProduct.tier === 'Pro' ? 'badge-progress' : 'badge-active'}`}>
                    {selectedProduct.tier === 'Enterprise' ? 'High' : (selectedProduct.tier === 'Pro' ? 'Medium' : 'Low')}
                  </span>
                </span>
              </div>

              <div className="crm-lead-detail-item">
                <span className="crm-lead-detail-label">
                  <DollarSign size={12} /> Expected value
                </span>
                <span className="crm-lead-detail-value" style={{ color: '#059669', fontWeight: 700 }}>
                  {selectedProduct.value || (selectedProduct.numericValue ? `$${Number(selectedProduct.numericValue).toLocaleString()}` : '$35,000')}
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
                <th>Product</th>
                <th>Product Name</th>
                <th>Category</th>
                <th>Base Pricing</th>
                <th>Billing Model</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} 
                className="crm-clickable-row"
                  onClick={() => setselectedProduct(p)}
                  title="Click to view Follow Up history & Lead details"
                >
                  <td><span className="crm-table-primary-text">{p.id}</span></td>
                  <td>
                    <div className="crm-table-user-cell">
                      <div className="crm-avatar-pill" style={{ backgroundColor: '#f5f3ff', color: '#7c3aed' }}>
                        <Package size={16} />
                      </div>
                      <div>
                        <span className="crm-table-primary-text">{p.name}</span>
                        <span className="crm-table-sub-text">{p.organizationName}</span>

                      </div>
                    </div>
                  </td>
                  <td><span className="crm-table-sub-text">{p.category}</span></td>
                  <td><strong>{p.price}</strong></td>
                  <td><span className="crm-tier-tag">{p.billing}</span></td>
                  <td>
                    <span className={`crm-status-badge ${p.status === 'Active' ? 'badge-active' : p.status === 'Draft' ? 'badge-progress' : 'badge-pending'}`}>
                      {p.status}
                    </span>
                  </td>
                  <td>
                    <div className="crm-row-actions">
                      <button type="button" className="crm-action-icon-btn" title="Edit product" onClick={(e) => {openEdit(p); e.stopPropagation();}}>
                        <Pencil size={14} />
                      </button>
                      <button type="button" className="crm-action-icon-btn danger" title="Delete product" onClick={(e) => {handleDelete(p.id); e.stopPropagation();}}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {products.length === 0 && <div className="crm-empty-state">No products in catalog.</div>}
        </div>
      </div>
    </div>
  );
}
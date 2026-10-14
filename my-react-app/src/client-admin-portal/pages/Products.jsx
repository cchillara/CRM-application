import React, { useState, useEffect } from 'react';
import { productsList } from '../data';
import { getStored, setStored } from '../storage';
import { Package, Plus, X, Pencil, Trash2 } from 'lucide-react';
import { getProducts, createProduct, updateProduct, deleteProduct } from '../Api/Product';

const STORAGE_KEY = 'products';
const EMPTY_FORM = { name: '', category: 'Software & SaaS', price: '₹50,000 / mo', billing: 'Annual Billing', inventory: 'Standard Tier · 10 Seats', status: 'Active' };
const CATEGORIES = ['Software & SaaS', 'Cloud Services', 'AI & Intelligence', 'Integration', 'Customer Support', 'Professional Services'];

export default function Products() {
  const [products, setProducts] = useState(() => getStored(STORAGE_KEY, productsList));
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const persist = (updated) => { setProducts(updated); setStored(STORAGE_KEY, updated); };

  /* Load products from API on mount */
  useEffect(() => {
    getProducts()
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          const mapped = data.map((p) => ({
            id: p.id,
            name: p.name || 'Unnamed Product',
            category: p.category || 'Software & SaaS',
            price: p.price ? (String(p.price).startsWith('₹') ? p.price : `₹${Number(p.price).toLocaleString()} / mo`) : '₹0 / mo',
            billing: p.billing || 'Annual Billing',
            inventory: p.inventory || 'Standard Tier',
            status: p.status === 'ACTIVE' || p.status === 'Active' ? 'Active' : 'Inactive',
          }));
          persist(mapped);
        }
      })
      .catch((err) => console.warn('[Products] API unavailable, using local data:', err.message));
  }, []);

  const openAdd = () => { setEditingProduct(null); setForm(EMPTY_FORM); setIsModalOpen(true); };
  const openEdit = (p) => {
    setEditingProduct(p);
    setForm({ name: p.name, category: p.category, price: p.price, billing: p.billing, inventory: p.inventory, status: p.status });
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
      price: form.price.trim(),
      billing: form.billing,
      inventory: form.inventory.trim(),
      status: form.status
    };
    if (editingProduct) {
      const optimistic = { ...editingProduct, ...payload };
      persist(products.map(p => p.id === editingProduct.id ? optimistic : p));
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
        if (saved?.id) setProducts(prev => prev.map(p => p.id === created.id ? { ...p, ...saved } : p));
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
                      placeholder="e.g. ₹60,000 / mo" className="crm-form-input" />
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
                  <label className="crm-form-label">Edition / Inventory Details</label>
                  <input type="text" name="inventory" value={form.inventory} onChange={handleChange}
                    placeholder="e.g. Enterprise Edition · Up to 50 Users" className="crm-form-input" />
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

      <div className="crm-card">
        <div className="crm-table-container">
          <table className="crm-table">
            <thead>
              <tr>
                <th>Product SKU</th>
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
                <tr key={p.id}>
                  <td><span className="crm-table-primary-text">{p.id}</span></td>
                  <td>
                    <div className="crm-table-user-cell">
                      <div className="crm-avatar-pill" style={{ backgroundColor: '#f5f3ff', color: '#7c3aed' }}>
                        <Package size={16} />
                      </div>
                      <div>
                        <span className="crm-table-primary-text">{p.name}</span>
                        <span className="crm-table-sub-text">{p.inventory}</span>
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
                      <button type="button" className="crm-action-icon-btn" title="Edit product" onClick={() => openEdit(p)}>
                        <Pencil size={14} />
                      </button>
                      <button type="button" className="crm-action-icon-btn danger" title="Delete product" onClick={() => handleDelete(p.id)}>
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

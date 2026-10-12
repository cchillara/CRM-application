import { useState } from "react";
import { Search, Trash2, Pencil } from "lucide-react";
import ConfirmDialog from "../../components/common/ConfirmDialog.jsx";
import DataTable from "../../components/common/DataTable.jsx";
import StatusBadge from "../../components/common/StatusBadge.jsx";
import AddButton from "../../components/sales/AddButton.jsx";
import ProductForm from "../../components/sales/ProductForm.jsx";
import { salesProducts } from "../../data/salesProductsData.js";
import "./SalesProducts.css";

function SalesProducts() {
  const [products, setProducts] = useState(salesProducts);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [formProduct, setFormProduct] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);

  const query = search.trim().toLowerCase();
  const visibleProducts = products.filter((product) => {
    const matchesSearch = !query || `${product.name} ${product.code}`.toLowerCase().includes(query);
    const matchesStatus = statusFilter === "ALL" || product.status === statusFilter;
    const matchesCategory = categoryFilter === "ALL" || product.category === categoryFilter;
    return matchesSearch && matchesStatus && matchesCategory;
  });
  const categories = [...new Set(products.map((product) => product.category))];

  const openAddForm = () => {
    setFormProduct(null);
    setShowForm(true);
  };

  const saveProduct = (values) => {
    if (formProduct) {
      setProducts((currentProducts) => currentProducts.map((product) => product.id === formProduct.id ? { ...product, ...values } : product));
    } else {
      setProducts((currentProducts) => [{ id: `product-${Date.now()}`, ...values }, ...currentProducts]);
    }
    setShowForm(false);
    setFormProduct(null);
  };

  const deleteProduct = () => {
    setProducts((currentProducts) => currentProducts.filter((product) => product.id !== productToDelete.id));
    setProductToDelete(null);
  };

  return (
    <div className="sales-products-page">
      <header className="sales-products-header">
        <div>
          <h1>Products</h1>
          <p>Manage the products and services your organisation offers to customers.</p>
        </div>
        <AddButton onClick={openAddForm}>Add Product</AddButton>
      </header>

      <section className="sales-products-card" aria-label="Product catalogue">
        <div className="sales-products-toolbar">
          <div className="sales-products-filters">
            <label className="sales-products-search">
              <Search size={17} strokeWidth={1.8} aria-hidden="true" />
              <input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search products" aria-label="Search products by name or code" />
            </label>
            <select aria-label="Filter products by status" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              <option value="ALL">All statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
            <select aria-label="Filter products by category" value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}>
              <option value="ALL">All categories</option>
              {categories.map((category) => <option key={category}>{category}</option>)}
            </select>
          </div>

          <DataTable
            headers={["Product", "Code", "Category", "Price", "Status", "Actions"]}
            emptyMessage={products.length ? "No products match your search or filters." : "No products have been added yet."}
            tableClassName="sales-products-table"
          >
            {visibleProducts.map((product) => (
              <tr key={product.id}>
                <td><div className="sales-products-name">{product.name}<span>{product.description}</span></div></td>
                <td>{product.code || "—"}</td>
                <td>{product.category}</td>
                <td>{new Intl.NumberFormat("en-US", { style: "currency", currency: product.currency }).format(product.price)}</td>
                <td><StatusBadge status={product.status} variant={product.status === "ACTIVE" ? "success" : "neutral"} /></td>
                <td>
                  <div className="sales-products-actions">
                    <button type="button" aria-label={`Edit ${product.name}`} onClick={() => { setFormProduct(product); setShowForm(true); }}><Pencil size={16} /></button>
                    <button type="button" aria-label={`Delete ${product.name}`} onClick={() => setProductToDelete(product)}><Trash2 size={16} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </DataTable>
        </div>
      </section>

      {showForm && <ProductForm product={formProduct} onClose={() => setShowForm(false)} onSubmit={saveProduct} />}
      {productToDelete && <ConfirmDialog title="Delete product?" message={`Are you sure you want to delete “${productToDelete.name}”? This action cannot be undone.`} onCancel={() => setProductToDelete(null)} onConfirm={deleteProduct} confirmLabel="Delete Product" />}
    </div>
  );
}

export default SalesProducts;

import { useState } from "react";
import FormModal from "../common/FormModal.jsx";

function ProductForm({ product, onClose, onSubmit }) {
  const [values, setValues] = useState(product || {
    name: "",
    code: "",
    category: "Software",
    description: "",
    price: "",
    currency: "USD",
    status: "ACTIVE",
  });
  const [error, setError] = useState("");

  const updateValue = (field, value) => setValues((current) => ({ ...current, [field]: value }));

  const submitForm = (event) => {
    event.preventDefault();
    const price = Number(values.price);
    if (!values.name.trim() || !values.category || values.price === "") {
      setError("Add a product name, category, and price.");
      return;
    }
    if (!Number.isFinite(price) || price < 0) {
      setError("Enter a valid price of zero or more.");
      return;
    }

    onSubmit({ ...values, name: values.name.trim(), code: values.code.trim(), price });
  };

  return (
    <form onSubmit={submitForm}>
      <FormModal
        title={product ? "Edit Product" : "Add Product"}
        onClose={onClose}
        actions={<><button className="form-modal-cancel" type="button" onClick={onClose}>Cancel</button><button className="form-modal-submit" type="submit">Save Product</button></>}
      >
        <div className="sales-form-grid">
          <label className="sales-form-field full-width">Product name *<input autoFocus required value={values.name} onChange={(event) => updateValue("name", event.target.value)} /></label>
          <label className="sales-form-field">Product code<input value={values.code} onChange={(event) => updateValue("code", event.target.value)} /></label>
          <label className="sales-form-field">Category *<select required value={values.category} onChange={(event) => updateValue("category", event.target.value)}><option>Software</option><option>Services</option><option>Hardware</option></select></label>
          <label className="sales-form-field">Price *<input type="number" min="0" step="0.01" required value={values.price} onChange={(event) => updateValue("price", event.target.value)} /></label>
          <label className="sales-form-field">Currency<select value={values.currency} onChange={(event) => updateValue("currency", event.target.value)}><option value="USD">USD</option><option value="EUR">EUR</option><option value="GBP">GBP</option></select></label>
          <label className="sales-form-field">Status<select value={values.status} onChange={(event) => updateValue("status", event.target.value)}><option value="ACTIVE">Active</option><option value="INACTIVE">Inactive</option></select></label>
          <label className="sales-form-field full-width">Description<textarea rows="3" value={values.description} onChange={(event) => updateValue("description", event.target.value)} /></label>
        </div>
        {error && <p className="sales-form-error" role="alert">{error}</p>}
      </FormModal>
    </form>
  );
}

export default ProductForm;

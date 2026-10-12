import { useState } from "react";
import FormModal from "../common/FormModal.jsx";

function CustomerForm({ onClose, onSubmit }) {
  const [values, setValues] = useState({ name: "", company: "", email: "", phone: "", status: "ACTIVE" });
  const [error, setError] = useState("");

  const updateValue = (field, value) => setValues((current) => ({ ...current, [field]: value }));

  const submitForm = (event) => {
    event.preventDefault();
    if (!values.name.trim() || !values.company.trim()) {
      setError("Add a customer name and company.");
      return;
    }
    onSubmit(values);
  };

  return (
    <form onSubmit={submitForm}>
      <FormModal
        title="Add Customer"
        onClose={onClose}
        actions={<><button className="form-modal-cancel" type="button" onClick={onClose}>Cancel</button><button className="form-modal-submit" type="submit">Save Customer</button></>}
      >
        <div className="sales-form-grid">
          <label className="sales-form-field">Customer name *<input required value={values.name} onChange={(event) => updateValue("name", event.target.value)} /></label>
          <label className="sales-form-field">Company *<input required value={values.company} onChange={(event) => updateValue("company", event.target.value)} /></label>
          <label className="sales-form-field">Email<input type="email" value={values.email} onChange={(event) => updateValue("email", event.target.value)} /></label>
          <label className="sales-form-field">Phone<input type="tel" value={values.phone} onChange={(event) => updateValue("phone", event.target.value)} /></label>
          <label className="sales-form-field full-width">Status<select value={values.status} onChange={(event) => updateValue("status", event.target.value)}><option value="ACTIVE">Active</option><option value="INACTIVE">Inactive</option></select></label>
        </div>
        {error && <p className="sales-form-error" role="alert">{error}</p>}
      </FormModal>
    </form>
  );
}

export default CustomerForm;

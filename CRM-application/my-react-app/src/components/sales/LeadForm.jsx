import { useState } from "react";
import FormModal from "../common/FormModal.jsx";

function LeadForm({ onClose, onSubmit }) {
  const [values, setValues] = useState({ title: "", firstName: "", lastName: "", email: "", phone: "", jobTitle: "", company: "", source: "WEBSITE", description: "" });
  const [error, setError] = useState("");

  const updateValue = (field, value) => setValues((current) => ({ ...current, [field]: value }));

  const submitForm = (event) => {
    event.preventDefault();
    if (!values.title.trim() || !values.firstName.trim()) {
      setError("Add a lead title and contact first name.");
      return;
    }
    onSubmit(values);
  };

  return (
    <form onSubmit={submitForm}>
      <FormModal
        title="Add Lead"
        onClose={onClose}
        actions={<><button className="form-modal-cancel" type="button" onClick={onClose}>Cancel</button><button className="form-modal-submit" type="submit">Save Lead</button></>}
      >
        <div className="sales-form-grid">
          <label className="sales-form-field full-width">Lead title *<input required value={values.title} onChange={(event) => updateValue("title", event.target.value)} placeholder="e.g. Website inquiry" /></label>
          <label className="sales-form-field">First name *<input required value={values.firstName} onChange={(event) => updateValue("firstName", event.target.value)} /></label>
          <label className="sales-form-field">Last name<input value={values.lastName} onChange={(event) => updateValue("lastName", event.target.value)} /></label>
          <label className="sales-form-field">Email<input type="email" value={values.email} onChange={(event) => updateValue("email", event.target.value)} /></label>
          <label className="sales-form-field">Phone<input type="tel" value={values.phone} onChange={(event) => updateValue("phone", event.target.value)} /></label>
          <label className="sales-form-field">Job title<input value={values.jobTitle} onChange={(event) => updateValue("jobTitle", event.target.value)} /></label>
          <label className="sales-form-field">Company<input value={values.company} onChange={(event) => updateValue("company", event.target.value)} /></label>
          <label className="sales-form-field full-width">Source<select value={values.source} onChange={(event) => updateValue("source", event.target.value)}><option value="WEBSITE">Website</option><option value="REFERRAL">Referral</option><option value="SOCIAL_MEDIA">Social media</option><option value="EMAIL">Email</option><option value="PHONE">Phone</option></select></label>
          <label className="sales-form-field full-width">Description<textarea value={values.description} onChange={(event) => updateValue("description", event.target.value)} rows="3" /></label>
        </div>
        {error && <p className="sales-form-error" role="alert">{error}</p>}
      </FormModal>
    </form>
  );
}

export default LeadForm;

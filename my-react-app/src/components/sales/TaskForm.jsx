import { useState } from "react";
import FormModal from "../common/FormModal.jsx";

function TaskForm({ onClose, onSubmit, relatedOptions }) {
  const [values, setValues] = useState({ title: "", description: "", dueDate: "", relatedId: "" });
  const [error, setError] = useState("");

  const updateValue = (field, value) => setValues((current) => ({ ...current, [field]: value }));

  const submitForm = (event) => {
    event.preventDefault();
    if (!values.title.trim()) {
      setError("Add a task title.");
      return;
    }
    const related = relatedOptions.find((option) => option.id === values.relatedId);
    onSubmit({
      title: values.title.trim(),
      description: values.description.trim(),
      dueDate: values.dueDate || null,
      relatedTo: related ? { type: related.type, name: related.name } : null,
    });
  };

  return (
    <form onSubmit={submitForm}>
      <FormModal
        title="Add Task"
        onClose={onClose}
        actions={<><button className="form-modal-cancel" type="button" onClick={onClose}>Cancel</button><button className="form-modal-submit" type="submit">Save Task</button></>}
      >
        <div className="sales-form-grid">
          <label className="sales-form-field full-width">Task title *<input required value={values.title} onChange={(event) => updateValue("title", event.target.value)} placeholder="e.g. Follow up on proposal" /></label>
          <label className="sales-form-field">Due date<input type="date" value={values.dueDate} onChange={(event) => updateValue("dueDate", event.target.value)} /></label>
          <label className="sales-form-field">Related to<select value={values.relatedId} onChange={(event) => updateValue("relatedId", event.target.value)}><option value="">None</option>{relatedOptions.map((option) => <option key={option.id} value={option.id}>{option.type}: {option.name}</option>)}</select></label>
          <label className="sales-form-field full-width">Description<textarea rows="3" value={values.description} onChange={(event) => updateValue("description", event.target.value)} /></label>
        </div>
        {error && <p className="sales-form-error" role="alert">{error}</p>}
      </FormModal>
    </form>
  );
}

export default TaskForm;

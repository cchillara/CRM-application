import { X } from "lucide-react";
import "./FormModal.css";

function FormModal({ title, onClose, children, actions }) {
  return (
    <div className="form-modal-backdrop" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <section className="form-modal" role="dialog" aria-modal="true" aria-labelledby="form-modal-title">
        <header className="form-modal-header">
          <h2 id="form-modal-title">{title}</h2>
          <button className="form-modal-close" type="button" aria-label="Close" onClick={onClose}>
            <X size={18} strokeWidth={1.8} />
          </button>
        </header>
        <div className="form-modal-content">{children}</div>
        {actions && <footer className="form-modal-actions">{actions}</footer>}
      </section>
    </div>
  );
}

export default FormModal;

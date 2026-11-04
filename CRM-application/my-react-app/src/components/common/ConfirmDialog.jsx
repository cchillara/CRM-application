import "./ConfirmDialog.css";

function ConfirmDialog({ title, message, onCancel, onConfirm, confirmLabel = "Delete" }) {
  return (
    <div className="confirm-dialog-backdrop" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onCancel();
    }}>
      <section className="confirm-dialog" role="alertdialog" aria-modal="true" aria-labelledby="confirm-dialog-title" aria-describedby="confirm-dialog-message">
        <h2 id="confirm-dialog-title">{title}</h2>
        <p id="confirm-dialog-message">{message}</p>
        <div className="confirm-dialog-actions">
          <button className="confirm-dialog-cancel" type="button" onClick={onCancel}>Cancel</button>
          <button className="confirm-dialog-delete" type="button" onClick={onConfirm}>{confirmLabel}</button>
        </div>
      </section>
    </div>
  );
}

export default ConfirmDialog;

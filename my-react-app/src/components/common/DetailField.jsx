import "./DetailField.css";

function DetailField({ label, value, icon: Icon, emptyValue = "—", className = "" }) {
  const hasValue = value !== null && value !== undefined && value !== "";

  return (
    <div className={`detail-field ${className}`.trim()}>
      <span className="detail-field-label">
        {Icon && <Icon size={15} aria-hidden="true" />}
        {label}
      </span>
      <span className="detail-field-value">{hasValue ? value : emptyValue}</span>
    </div>
  );
}

export default DetailField;

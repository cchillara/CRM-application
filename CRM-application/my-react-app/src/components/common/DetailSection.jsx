import "./DetailSection.css";

function DetailSection({ title, children, className = "" }) {
  return (
    <section className={`detail-section ${className}`.trim()}>
      <h2 className="detail-section-title">{title}</h2>
      <div className="detail-section-content">{children}</div>
    </section>
  );
}

export default DetailSection;

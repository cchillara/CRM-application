import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import "./RecordDetailsLayout.css";

function RecordDetailsLayout({
  backTo, backLabel, avatar, title, subtitle, status, actions, children, secondary}) {
  return (
    <div className="record-details-layout">
      <Link className="record-details-back-link" to={backTo}>
        <ArrowLeft size={16} aria-hidden="true" />
        {backLabel}
      </Link>

      <header className="record-details-header">
        <div className="record-details-identity">
          {avatar && <span className="record-details-avatar" aria-hidden="true">{avatar}</span>}
          <div className="record-details-heading-copy">
            <h1>{title}</h1>
            {subtitle && <p>{subtitle}</p>}
          </div>
        </div>
        <div className="record-details-header-actions">
          {status}
          {actions}
        </div>
      </header>

      <div className={`record-details-content ${secondary ? "has-secondary" : ""}`}>
        <main className="record-details-main">{children}</main>
        {secondary && <aside className="record-details-secondary">{secondary}</aside>}
      </div>
    </div>
  );
}

export default RecordDetailsLayout;

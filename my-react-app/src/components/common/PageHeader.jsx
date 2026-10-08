import { CalendarDays } from "lucide-react";
import "./PageHeader.css";

function PageHeader({ eyebrow, title, description, dateLabel }) {
  return (
    <header className="page-header">
      <div>
        {eyebrow && <span className="page-header-eyebrow">{eyebrow}</span>}
        <h1>{title}</h1>
        <p>{description}</p>
      </div>

      {dateLabel && (
        <div className="page-header-date">
          <CalendarDays size={18} strokeWidth={1.8} />
          <span>{dateLabel}</span>
        </div>
      )}
    </header>
  );
}

export default PageHeader;

import {CalendarDays,CheckSquare,FileText,Mail,MapPin,Phone,StickyNote,Video} from "lucide-react";
import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import DetailField from "../../components/common/DetailField.jsx";
import DetailSection from "../../components/common/DetailSection.jsx";
import RecordDetailsLayout from "../../components/common/RecordDetailsLayout.jsx";
import StatusBadge from "../../components/common/StatusBadge.jsx";
import { useSalesData } from "../../components/sales/SalesDataContext.jsx";
import "./SalesLeadDetails.css";

const leadStatusVariants = {
  NEW: "neutral",
  CONTACTED: "warning",
  QUALIFIED: "success",
  UNQUALIFIED: "danger",
  CONVERTED: "success",
};

const leadStatusLabels = {
  NEW: "New",
  CONTACTED: "Contacted",
  QUALIFIED: "Qualified",
  UNQUALIFIED: "Unqualified",
  CONVERTED: "Converted",
};

const leadSourceLabels = {
  WEBSITE: "Website",
  REFERRAL: "Referral",
  SOCIAL_MEDIA: "Social Media",
  EMAIL: "Email",
  PHONE: "Phone",
  ADVERTISEMENT: "Advertisement",
  OTHER: "Other",
};

const activityTypeLabels = {
  CALL: "Call",
  EMAIL: "Email",
  MEETING: "Meeting",
  NOTE: "Note",
  FOLLOW_UP: "Follow-up",
};

const taskStatusVariants = {
  TODO: "neutral",
  IN_PROGRESS: "info",
  COMPLETED: "success",
  CANCELLED: "danger",
};

const activityIcons = {
  CALL: Phone,
  EMAIL: Mail,
  MEETING: Video,
  NOTE: StickyNote,
  FOLLOW_UP: CalendarDays,
};

function getContactName(contact, fallback = "") {
  return [contact?.firstName, contact?.lastName].filter(Boolean).join(" ") || fallback;
}

function ActivityItem({ activity }) {
  const ActivityIcon = activityIcons[activity.type] || FileText;

  return (
    <article className="sales-lead-activity-item">
      <span className="sales-lead-activity-icon"><ActivityIcon size={15} aria-hidden="true" /></span>
      <div className="sales-lead-activity-copy">
        <div className="sales-lead-activity-heading">
          <strong>{activityTypeLabels[activity.type] || activity.type || "Activity"}</strong>
          <time dateTime={activity.createdAt}>{activity.createdAt || "—"}</time>
        </div>
        <p>{activity.description || "No description"}</p>
      </div>
    </article>
  );
}

function TaskItem({ task }) {
  return (
    <article className="sales-lead-task-item">
      <div className="sales-lead-task-icon"><CheckSquare size={16} aria-hidden="true" /></div>
      <div className="sales-lead-task-copy">
        <strong>{task.title}</strong>
        {task.description && <p>{task.description}</p>}
        <span>Due {task.dueDate || "No due date"}</span>
      </div>
      <StatusBadge status={task.status} variant={taskStatusVariants[task.status] || "neutral"} />
    </article>
  );
}

function SalesLeadDetails() {
  const { leadId } = useParams();
  const navigate = useNavigate();
  const { leads, updateLeadStatus, deleteLead, convertLeadToCustomer } = useSalesData();
  const [confirmation, setConfirmation] = useState(null);
  const lead = leads.find((item) => item.id === leadId);

  if (!lead) {
    return (
      <RecordDetailsLayout
        backTo="/leads"
        backLabel="Back to Leads"
        title="Lead not found"
        subtitle="This lead may have been deleted or converted to a customer."
      >
        <DetailSection title="Record unavailable">
          <p className="sales-lead-empty-state">Return to Leads to choose another record.</p>
        </DetailSection>
      </RecordDetailsLayout>
    );
  }

  const contact = lead.contact;
  const company = lead.company;
  const contactName = getContactName(contact, lead.title);
  const activities = [...(lead.activities || [])].sort((first, second) => (second.createdAt || "").localeCompare(first.createdAt || ""));
  const tasks = [...(lead.tasks || [])].sort((first, second) => (first.dueDate || "").localeCompare(second.dueDate || ""));
  const isConverted = Boolean(lead.convertedAt || lead.customerId);
  const customerName = lead.customer?.company?.name || lead.customer?.name || company?.name;
  const confirmAction = () => {
    if (confirmation === "delete") {
      deleteLead(lead.id);
      navigate("/leads");
    } else {
      convertLeadToCustomer(lead.id);
      navigate("/customers");
    }
    setConfirmation(null);
  };
  const actions = (
    <div className="sales-lead-details-actions">
      <select
        aria-label="Change lead status"
        value={lead.status}
        onChange={(event) => updateLeadStatus(lead.id, event.target.value)}
      >
        <option value="NEW">Change status · New</option>
        <option value="CONTACTED">Change status · Contacted</option>
        <option value="QUALIFIED">Change status · Qualified</option>
        <option value="UNQUALIFIED">Change status · Unqualified</option>
        <option value="CONVERTED">Change status · Converted</option>
      </select>
      <button className="sales-lead-convert-button" type="button" onClick={() => setConfirmation("convert")}>
        Convert to Customer
      </button>
      <button className="sales-lead-delete-button" type="button" onClick={() => setConfirmation("delete")}>
        Delete Lead
      </button>
    </div>
  );

  return (
    <RecordDetailsLayout
      backTo="/leads"
      backLabel="Back to Leads"
      avatar={contactName.split(" ").map((part) => part[0]).join("")}
      title={contactName}
      subtitle={[company?.name, contact?.email].filter(Boolean).join(" · ")}
      status={<StatusBadge status={lead.status} variant={leadStatusVariants[lead.status] || "neutral"} />}
      actions={actions}
      secondary={(
        <div className="sales-lead-details-side-stack">
          <DetailSection title="Related Tasks" className="sales-lead-related-section">
            {tasks.length ? (
              <div className="sales-lead-task-list">
                {tasks.map((task) => <TaskItem key={task.id} task={task} />)}
              </div>
            ) : (
              <p className="sales-lead-empty-state">No tasks associated with this lead.</p>
            )}
          </DetailSection>

          <DetailSection title="Contact History" className="sales-lead-related-section">
            {activities.length ? (
              <div className="sales-lead-activity-list">
                {activities.map((activity) => <ActivityItem key={activity.id} activity={activity} />)}
              </div>
            ) : (
              <p className="sales-lead-empty-state">No activity recorded yet.</p>
            )}
          </DetailSection>
        </div>
      )}
    >
      <div className="sales-lead-details-main-stack">
        <DetailSection title="Lead Information">
          <div className="sales-lead-detail-fields">
            <DetailField label="Title" value={lead.title} />
            <DetailField label="Status" value={leadStatusLabels[lead.status] || lead.status || "—"} />
            <DetailField label="Source" value={leadSourceLabels[lead.source] || lead.source || "—"} />
            <DetailField label="Created" value={lead.createdAt || "—"} />
            <DetailField label="Last updated" value={lead.updatedAt || "—"} />
            {lead.description && (
              <DetailField className="sales-lead-detail-description" label="Description" value={lead.description} />
            )}
          </div>
        </DetailSection>

        <DetailSection title="Contact Information">
          {contact ? (
            <div className="sales-lead-detail-fields">
              <DetailField label="First Name" value={contact.firstName} />
              <DetailField label="Last Name" value={contact.lastName} />
              <DetailField label="Full Name" value={getContactName(contact)} />
              <DetailField label="Email" value={contact.email} icon={Mail} />
              <DetailField label="Phone" value={contact.phone} icon={Phone} />
              <DetailField label="Job Title" value={contact.jobTitle} />
            </div>
          ) : (
            <p className="sales-lead-empty-state">No contact information available.</p>
          )}
        </DetailSection>

        <DetailSection title="Company Information">
          {company ? (
            <div className="sales-lead-detail-fields">
              <DetailField label="Company Name" value={company.name} />
              {company.email && <DetailField label="Email" value={company.email} icon={Mail} />}
              {company.phone && <DetailField label="Phone" value={company.phone} icon={Phone} />}
              {company.website && <DetailField label="Website" value={company.website} />}
              {company.address && <DetailField label="Address" value={company.address} icon={MapPin} />}
              {company.city && <DetailField label="City" value={company.city} />}
              {company.state && <DetailField label="State" value={company.state} />}
              {company.country && <DetailField label="Country" value={company.country} />}
            </div>
          ) : (
            <p className="sales-lead-empty-state">No company information available.</p>
          )}
        </DetailSection>

        {isConverted && (
          <DetailSection title="Conversion">
            <div className="sales-lead-detail-fields">
              <DetailField label="Converted on" value={lead.convertedAt || "—"} />
              {lead.customerId && (
                <DetailField
                  label="Customer"
                  value={<Link className="sales-lead-related-link" to="/customers">{customerName || "View customer record"}</Link>}
                />
              )}
              {lead.convertedBy && (
                <DetailField label="Converted by" value={getContactName(lead.convertedBy)} />
              )}
            </div>
          </DetailSection>
        )}
      </div>
      {confirmation && (
        <div className="sales-lead-dialog-backdrop" onClick={(event) => {
          if (event.target === event.currentTarget) {
            setConfirmation(null);
          }
        }}>
          <section
            className="sales-lead-confirm-dialog"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="sales-lead-confirm-title"
            aria-describedby="sales-lead-confirm-description"
          >
            <h2 id="sales-lead-confirm-title">
              {confirmation === "delete" ? "Delete lead?" : "Convert lead to customer?"}
            </h2>
            <p id="sales-lead-confirm-description">
              {confirmation === "delete"
                ? `Are you sure you want to delete ${contactName}? This action cannot be undone.`
                : `Convert ${contactName} into a customer? The lead will be removed from Leads and added to Customers.`}
            </p>
            <div className="sales-lead-confirm-actions">
              <button className="sales-lead-confirm-cancel" type="button" onClick={() => setConfirmation(null)}>
                Cancel
              </button>
              <button
                className={confirmation === "delete" ? "sales-lead-confirm-delete" : "sales-lead-confirm-convert"}
                type="button"
                onClick={confirmAction}
              >
                {confirmation === "delete" ? "Delete Lead" : "Convert to Customer"}
              </button>
            </div>
          </section>
        </div>
      )}
    </RecordDetailsLayout>
  );
}

export default SalesLeadDetails;

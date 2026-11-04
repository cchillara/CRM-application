import "./StatusBadge.css";

const STATUS_LABELS = {
  NEW: "New",
  CONTACTED: "Contacted",
  QUALIFIED: "Qualified",
  UNQUALIFIED: "Unqualified",
  CONVERTED: "Converted",
  ACTIVE: "Active",
  INACTIVE: "Inactive",
  PROSPECTING: "Prospecting",
  QUALIFICATION: "Qualification",
  PROPOSAL: "Proposal",
  NEGOTIATION: "Negotiation",
  WON: "Won",
  LOST: "Lost",
  TODO: "To Do",
  IN_PROGRESS: "In Progress",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

const VARIANTS = new Set(["neutral", "info", "success", "warning", "danger"]);

function formatStatusLabel(status) {
  if (typeof status !== "string" || !status.trim()) {
    return "Unknown";
  }

  const normalizedStatus = status.trim().toUpperCase();
  return (
    STATUS_LABELS[normalizedStatus] ||
    status
      .trim()
      .split(/[_\s-]+/)
      .filter(Boolean)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ") ||
    "Unknown"
  );
}

function StatusBadge({ status, variant = "neutral" }) {
  const safeVariant = VARIANTS.has(variant) ? variant : "neutral";

  return (
    <span className={`status-badge status-badge-${safeVariant}`}>
      {formatStatusLabel(status)}
    </span>
  );
}

export default StatusBadge;

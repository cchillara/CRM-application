import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Ellipsis, Search, Trash2 } from "lucide-react";
import DataTable from "../../components/common/DataTable.jsx";
import StatusBadge from "../../components/common/StatusBadge.jsx";
import { getLeadContactName, getLeadLastContact, useSalesData } from "../../components/sales/SalesDataContext.jsx";
import "./SalesLeads.css";

const statusVariants = {
  NEW: "neutral",
  CONTACTED: "warning",
  QUALIFIED: "success",
  UNQUALIFIED: "danger",
  CONVERTED: "success",
};

const tabs = [
  { label: "All Leads", value: "all" },
  { label: "My Leads", value: "mine" },
  { label: "New", value: "NEW" },
  { label: "Contacted", value: "CONTACTED" },
  { label: "Qualified", value: "QUALIFIED" },
  { label: "Unqualified", value: "UNQUALIFIED" },
  { label: "Converted", value: "CONVERTED" },
];

function SalesLeads() {
  const navigate = useNavigate();
  const { leads, deleteLead } = useSalesData();
  const [activeTab, setActiveTab] = useState("all");
  const [search, setSearch] = useState("");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [openMenuLeadId, setOpenMenuLeadId] = useState(null);
  const [leadToDelete, setLeadToDelete] = useState(null);
  const normalizedSearch = search.trim().toLowerCase();

  const filteredLeads = leads.filter((lead) => {
    const matchesTab =
      activeTab === "all" ||
      (activeTab === "mine" && lead.assignedTo?.id === "user-001") ||
      lead.status === activeTab;
    const matchesSource = sourceFilter === "all" || lead.source === sourceFilter;
    const searchableValues = [
      getLeadContactName(lead),
      lead.contact?.email,
      lead.company?.name,
      lead.title,
    ];
    const matchesSearch =
      !normalizedSearch ||
      searchableValues.some((value) => value?.toLowerCase().includes(normalizedSearch));

    return matchesTab && matchesSource && matchesSearch;
  });

  const confirmDeleteLead = () => {
    deleteLead(leadToDelete.id);
    setLeadToDelete(null);
  };

  return (
    <div className="sales-leads-page">
      <header className="sales-leads-header">
        <div>
          <h1>Leads</h1>
          <p>Manage and track your sales leads.</p>
        </div>
      </header>

      <section className="sales-leads-card" aria-label="Leads">
        <div className="sales-leads-toolbar">
          <div className="sales-leads-tabs" role="tablist" aria-label="Lead views">
            {tabs.map((tab) => (
              <button
                key={tab.value}
                className={`sales-leads-tab ${activeTab === tab.value ? "active" : ""}`}
                type="button"
                role="tab"
                aria-selected={activeTab === tab.value}
                onClick={() => setActiveTab(tab.value)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="sales-leads-filters">
            <div className="sales-leads-search">
              <Search size={17} strokeWidth={1.8} aria-hidden="true" />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search leads"
                aria-label="Search leads"
              />
            </div>
            <div className="sales-leads-select-label">
              <select
                aria-label="Filter by source"
                value={sourceFilter}
                onChange={(event) => setSourceFilter(event.target.value)}
              >
                <option value="all">All sources</option>
                <option value="WEBSITE">Website</option>
                <option value="REFERRAL">Referral</option>
                <option value="SOCIAL_MEDIA">Social media</option>
                <option value="EMAIL">Email</option>
                <option value="PHONE">Phone</option>
              </select>
            </div>
          </div>
        </div>

        <DataTable
          headers={["Lead", "Company", "Status", "Source", "Last Contact", ""]}
          emptyMessage="No leads match your search or filters."
          tableClassName="sales-leads-table"
        >
          {filteredLeads.map((lead) => (
            <tr
              key={lead.id}
              className="sales-leads-data-row"
              tabIndex={0}
              aria-label={`Open ${getLeadContactName(lead)} lead details`}
              onClick={() => navigate(`/leads/${lead.id}`)}
              onKeyDown={(event) => {
                if (event.target === event.currentTarget && (event.key === "Enter" || event.key === " ")) {
                  event.preventDefault();
                  navigate(`/leads/${lead.id}`);
                }
              }}
            >
              <td>
                <div className="sales-leads-person">
                  <span className="sales-leads-avatar" aria-hidden="true">
                    {getLeadContactName(lead).split(" ").map((part) => part[0]).join("")}
                  </span>
                  <span className="sales-leads-person-copy">
                    <span className="sales-leads-name">{getLeadContactName(lead)}</span>
                    <span className="sales-leads-secondary">{lead.contact?.email || "No email"}</span>
                  </span>
                </div>
              </td>
              <td>
                <span className="sales-leads-company-copy">
                  <span className="sales-leads-company">{lead.company?.name || "No company"}</span>
                  <span className="sales-leads-secondary">{lead.title}</span>
                </span>
              </td>
              <td><StatusBadge status={lead.status} variant={statusVariants[lead.status] ?? "neutral"} /></td>
              <td><span className="sales-leads-source">{lead.source}</span></td>
              <td><span className="sales-leads-last-contact">{getLeadLastContact(lead)}</span></td>
              <td>
                <div className="sales-leads-actions" onClick={(event) => event.stopPropagation()}>
                  <button
                    className="sales-leads-row-action"
                    type="button"
                    aria-label={`More actions for ${getLeadContactName(lead)}`}
                    aria-haspopup="menu"
                    aria-expanded={openMenuLeadId === lead.id}
                    onClick={() => setOpenMenuLeadId((currentId) => currentId === lead.id ? null : lead.id)}
                  >
                    <Ellipsis size={19} strokeWidth={1.8} />
                  </button>
                  {openMenuLeadId === lead.id && (
                    <div className="sales-leads-action-menu" role="menu">
                      <button
                        className="sales-leads-menu-item"
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          setOpenMenuLeadId(null);
                          setLeadToDelete(lead);
                        }}
                      >
                        <Trash2 size={16} aria-hidden="true" />
                        Delete Lead
                      </button>
                    </div>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </DataTable>
      </section>

      {leadToDelete && (
        <div className="sales-leads-dialog-backdrop" onClick={(event) => {
          if (event.target === event.currentTarget) {
            setLeadToDelete(null);
          }
        }}>
          <section
            className="sales-leads-delete-dialog"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="sales-leads-delete-title"
            aria-describedby="sales-leads-delete-description"
          >
            <h2 id="sales-leads-delete-title">Delete lead?</h2>
            <p id="sales-leads-delete-description">
              Are you sure you want to delete {getLeadContactName(leadToDelete)}? This action cannot be undone.
            </p>
            <div className="sales-leads-dialog-actions">
              <button className="sales-leads-dialog-cancel" type="button" onClick={() => setLeadToDelete(null)}>
                Cancel
              </button>
              <button className="sales-leads-dialog-delete" type="button" onClick={confirmDeleteLead}>
                Delete Lead
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

export default SalesLeads;

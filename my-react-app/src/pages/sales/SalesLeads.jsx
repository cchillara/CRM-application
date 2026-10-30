import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { Ellipsis, Search, Trash2 } from "lucide-react";
import DataTable from "../../components/common/DataTable.jsx";
import ConfirmDialog from "../../components/common/ConfirmDialog.jsx";
import StatusBadge from "../../components/common/StatusBadge.jsx";
import AddButton from "../../components/sales/AddButton.jsx";
import LeadForm from "../../components/sales/LeadForm.jsx";
import { auth } from "../../firebase.js";
import "./SalesLeads.css";

const API_BASE_URL = (import.meta.env.VITE_API_URL || "http://localhost:5000")
  .replace(/\/$/, "");
const SALES_API_URL = `${API_BASE_URL}/api/v1/sales`;

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

function getLeadContactName(lead) {
  if (!lead) return "";
  const name = [lead.contact?.firstName, lead.contact?.lastName].filter(Boolean).join(" ");
  return name || lead.title || "Unknown Lead";
}

function getLeadLastContact(lead) {
  const latestActivity = [...(lead.activities || [])]
    .sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""))[0];
  if (!latestActivity) return "—";
  return new Date(latestActivity.createdAt).toLocaleDateString();
}

function SalesLeads() {
  const navigate = useNavigate();

  const [leads, setLeads] = useState([]);
  const [myLeads, setMyLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [activeTab, setActiveTab] = useState("all");
  const [search, setSearch] = useState("");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [openMenuLeadId, setOpenMenuLeadId] = useState(null);
  const [leadToDelete, setLeadToDelete] = useState(null);
  const [showLeadForm, setShowLeadForm] = useState(false);

  const fetchLeads = useCallback(async (user) => {
    if (!user) {
      setLeads([]);
      setMyLeads([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const idToken = await user.getIdToken();
      const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${idToken}`,
      };

      const [allRes, myRes] = await Promise.all([
        fetch(`${SALES_API_URL}/leads`, { headers }),
        fetch(`${SALES_API_URL}/leads?scope=mine`, { headers }),
      ]);

      const [allResult, myResult] = await Promise.all([
        allRes.json(),
        myRes.json(),
      ]);

      if (!allRes.ok || allResult.success === false) {
        throw new Error(allResult.message || "Failed to fetch leads");
      }

      setLeads(Array.isArray(allResult.data) ? allResult.data : []);
      setMyLeads(Array.isArray(myResult.data) ? myResult.data : []);
    } catch (err) {
      console.error("[SalesLeads] Fetch error:", err);
      setError(err.message || "Unable to load leads from the server.");
      setLeads([]);
      setMyLeads([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      fetchLeads(user);
    });
    return () => unsubscribe();
  }, [fetchLeads]);

  const handleCreateLead = async (values) => {
    try {
      const idToken = await auth.currentUser?.getIdToken();
      if (!idToken) throw new Error("Authentication required.");

      const response = await fetch(`${SALES_API_URL}/leads`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify(values),
      });

      const result = await response.json();
      if (!response.ok || result.success === false) {
        throw new Error(result.message || "Failed to create lead.");
      }

      const newLead = result.data;
      setLeads((prev) => [newLead, ...prev]);
      setMyLeads((prev) => [newLead, ...prev]);
      setShowLeadForm(false);
      setError("");
    } catch (err) {
      console.error("[SalesLeads] Create lead error:", err);
      setError(err.message || "Unable to save lead.");
    }
  };

  const confirmDeleteLead = async () => {
    if (!leadToDelete) return;

    try {
      const idToken = await auth.currentUser?.getIdToken();
      if (!idToken) throw new Error("Authentication required.");

      const response = await fetch(`${SALES_API_URL}/leads/${encodeURIComponent(leadToDelete.id)}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
      });

      const result = await response.json();
      if (!response.ok || result.success === false) {
        throw new Error(result.message || "Failed to delete lead.");
      }

      setLeads((prev) => prev.filter((lead) => lead.id !== leadToDelete.id));
      setMyLeads((prev) => prev.filter((lead) => lead.id !== leadToDelete.id));
      setLeadToDelete(null);
      setError("");
    } catch (err) {
      console.error("[SalesLeads] Delete lead error:", err);
      setError(err.message || "Unable to delete lead.");
      setLeadToDelete(null);
    }
  };

  const normalizedSearch = search.trim().toLowerCase();

  const currentDataset = activeTab === "mine" ? myLeads : leads;

  const filteredLeads = useMemo(() => {
    return currentDataset.filter((lead) => {
      const matchesTab =
        activeTab === "all" ||
        activeTab === "mine" ||
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
  }, [currentDataset, activeTab, sourceFilter, normalizedSearch]);

  return (
    <div className="sales-leads-page">
      <header className="sales-leads-header">
        <div>
          <h1>Leads</h1>
          <p>Manage and track your sales leads.</p>
        </div>
        <AddButton onClick={() => setShowLeadForm(true)}>Add Lead</AddButton>
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

        {/* Display loading or error alerts */}
        {error && <p className="sales-leads-error" role="alert" style={{ color: "var(--red-accent, #ef4444)", padding: "12px 20px", margin: 0 }}>{error}</p>}
        {loading && <p className="sales-leads-loading" role="status" style={{ padding: "20px", color: "var(--text-muted)" }}>Loading leads…</p>}

        <DataTable
          headers={["Lead", "Company", "Status", "Source", "Last Contact", ""]}
          emptyMessage={loading ? "Loading leads…" : error ? "Could not load leads." : "No leads match your search or filters."}
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
        <ConfirmDialog
          title="Delete lead?"
          message={`Are you sure you want to delete ${getLeadContactName(leadToDelete)}? This action cannot be undone.`}
          onCancel={() => setLeadToDelete(null)}
          onConfirm={confirmDeleteLead}
          confirmLabel="Delete Lead"
        />
      )}
      {showLeadForm && (
        <LeadForm
          onClose={() => setShowLeadForm(false)}
          onSubmit={handleCreateLead}
        />
      )}
    </div>
  );
}

export default SalesLeads;

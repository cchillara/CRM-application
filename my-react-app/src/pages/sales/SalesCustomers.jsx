import { useCallback, useEffect, useMemo, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { Search } from "lucide-react";
import DataTable from "../../components/common/DataTable.jsx";
import StatusBadge from "../../components/common/StatusBadge.jsx";
import AddButton from "../../components/sales/AddButton.jsx";
import CustomerForm from "../../components/sales/CustomerForm.jsx";
import { auth } from "../../firebase.js";
import "./SalesCustomers.css";

const API_BASE_URL = (import.meta.env.VITE_API_URL || "http://localhost:5000").replace(/\/$/, "");
const SALES_CUSTOMERS_URL = `${API_BASE_URL}/api/v1/sales/customers`;

async function requestCustomers(user, { scope, ...options } = {}) {
  if (!user) throw new Error("Please sign in to view customers.");

  const idToken = await user.getIdToken();
  const url = scope === "mine" ? `${SALES_CUSTOMERS_URL}?scope=mine` : SALES_CUSTOMERS_URL;
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${idToken}`,
      ...options.headers,
    },
  });
  const result = await response.json();

  if (!response.ok || result.success === false) {
    throw new Error(result.message || "Unable to complete the customer request.");
  }

  return result.data;
}

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString();
}

function SalesCustomers() {
  const [allCustomers, setAllCustomers] = useState([]);
  const [myCustomers, setMyCustomers] = useState([]);
  const [showCustomerForm, setShowCustomerForm] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [ownershipFilter, setOwnershipFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const fetchCustomers = useCallback(async (user) => {
    setLoading(true);
    setLoadError("");
    try {
      const [customers, assignedCustomers] = await Promise.all([
        requestCustomers(user),
        requestCustomers(user, { scope: "mine" }),
      ]);
      setAllCustomers(Array.isArray(customers) ? customers : []);
      setMyCustomers(Array.isArray(assignedCustomers) ? assignedCustomers : []);
    } catch (error) {
      setAllCustomers([]);
      setMyCustomers([]);
      setLoadError(error.message || "Unable to load customers.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => onAuthStateChanged(auth, (user) => {
    fetchCustomers(user);
  }), [fetchCustomers]);

  const handleCreateCustomer = async (values) => {
    const user = auth.currentUser;
    const customer = await requestCustomers(user, {
      method: "POST",
      body: JSON.stringify(values),
    });
    setAllCustomers((current) => [customer, ...current]);
    setMyCustomers((current) => [customer, ...current]);
    setShowCustomerForm(false);
  };

  const customers = useMemo(() => {
    const query = search.trim().toLowerCase();
    const ownerCustomers = ownershipFilter === "MINE" ? myCustomers : allCustomers;

    return ownerCustomers.filter((customer) => {
      const matchesSearch = !query ||
        [customer.name, customer.company, customer.email, customer.phone]
          .some((value) => (value || "").toLowerCase().includes(query));
      const matchesStatus = statusFilter === "ALL" || customer.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [allCustomers, myCustomers, ownershipFilter, search, statusFilter]);

  const activeCount = allCustomers.filter((customer) => customer.status === "ACTIVE").length;
  const now = new Date();
  const newThisMonthCount = allCustomers.filter((customer) => {
    const createdAt = new Date(customer.createdAt);
    return !Number.isNaN(createdAt.getTime()) &&
      createdAt.getMonth() === now.getMonth() &&
      createdAt.getFullYear() === now.getFullYear();
  }).length;

  const summary = [
    { label: "Total Customers", value: allCustomers.length },
    { label: "Active Customers", value: activeCount },
    { label: "New This Month", value: newThisMonthCount },
  ];

  return (
    <div className="sales-customers-page">
      <header className="sales-customers-header">
        <div>
          <h1>Customers</h1>
          <p>Manage your customer relationships and accounts.</p>
        </div>
        <AddButton onClick={() => setShowCustomerForm(true)}>Add Customer</AddButton>
      </header>

      <section className="sales-customers-summary" aria-label="Customer summary">
        {summary.map((item) => (
          <article className="sales-customers-summary-card" key={item.label}>
            <span>{item.label}</span>
            <strong>{loading ? "—" : item.value}</strong>
          </article>
        ))}
      </section>

      <section className="sales-customers-card" aria-label="Customer list">
        <div className="sales-customers-toolbar">
          <div className="sales-customers-ownership" role="group" aria-label="Customer ownership">
            <button
              type="button"
              className={ownershipFilter === "ALL" ? "active" : ""}
              aria-pressed={ownershipFilter === "ALL"}
              onClick={() => setOwnershipFilter("ALL")}
            >
              All Customers
            </button>
            <button
              type="button"
              className={ownershipFilter === "MINE" ? "active" : ""}
              aria-pressed={ownershipFilter === "MINE"}
              onClick={() => setOwnershipFilter("MINE")}
            >
              My Customers
            </button>
          </div>

          <div className="sales-customers-filters">
            <div className="sales-customers-search">
              <Search size={17} strokeWidth={1.8} aria-hidden="true" />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search customers"
                aria-label="Search customers"
              />
            </div>
            <div className="sales-customers-status-filter">
              <select
                aria-label="Filter customers by status"
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
              >
                <option value="ALL">All statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>
          </div>
        </div>

        {loadError && <p className="sales-customers-error" role="alert">{loadError}</p>}
        {loading && <p className="sales-customers-loading" role="status">Loading customers…</p>}
        <DataTable
          headers={["Customer", "Company", "Email", "Phone", "Status", "Last Contact"]}
          emptyMessage={loadError ? "Customer data could not be loaded." : "No customers match your search or filters."}
          tableClassName="sales-customers-table"
        >
          {customers.map((customer) => (
            <tr key={customer.id}>
              <td><span className="sales-customers-name">{customer.name}</span></td>
              <td><span className="sales-customers-company">{customer.company}</span></td>
              <td><span className="sales-customers-secondary">{customer.email}</span></td>
              <td><span className="sales-customers-secondary">{customer.phone}</span></td>
              <td>
                <StatusBadge
                  status={customer.status}
                  variant={customer.status === "ACTIVE" ? "success" : "danger"}
                />
              </td>
              <td><span className="sales-customers-last-contact">{formatDate(customer.lastContact)}</span></td>
            </tr>
          ))}
        </DataTable>
      </section>
      {showCustomerForm && <CustomerForm onClose={() => setShowCustomerForm(false)} onSubmit={handleCreateCustomer} />}
    </div>
  );
}

export default SalesCustomers;

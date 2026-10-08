import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import DataTable from "../../components/common/DataTable.jsx";
import StatusBadge from "../../components/common/StatusBadge.jsx";
import { useSalesData } from "../../components/sales/SalesDataContext.jsx";
import "./SalesCustomers.css";

const CURRENT_USER = "Subham Sharma";

function SalesCustomers() {
  const { customers: allCustomers } = useSalesData();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [ownershipFilter, setOwnershipFilter] = useState("ALL");

  const customers = useMemo(() => {
    const query = search.trim().toLowerCase();

    return allCustomers.filter((customer) => {
      const matchesSearch = !query ||
        [customer.name, customer.company, customer.email, customer.phone]
          .some((value) => value.toLowerCase().includes(query));
      const matchesStatus = statusFilter === "ALL" || customer.status === statusFilter;
      const matchesOwner = ownershipFilter === "ALL" || customer.assignedTo === CURRENT_USER;

      return matchesSearch && matchesStatus && matchesOwner;
    });
  }, [allCustomers, ownershipFilter, search, statusFilter]);

  const activeCount = allCustomers.filter((customer) => customer.status === "ACTIVE").length;
  const newThisMonthCount = allCustomers.filter((customer) =>
    customer.createdAt.startsWith("2026-10-")
  ).length;

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
      </header>

      <section className="sales-customers-summary" aria-label="Customer summary">
        {summary.map((item) => (
          <article className="sales-customers-summary-card" key={item.label}>
            <span>{item.label}</span>
            <strong>{item.value}</strong>
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

        <DataTable
          headers={["Customer", "Company", "Email", "Phone", "Status", "Last Contact"]}
          emptyMessage="No customers match your search or filters."
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
              <td><span className="sales-customers-last-contact">{customer.lastContact}</span></td>
            </tr>
          ))}
        </DataTable>
      </section>
    </div>
  );
}

export default SalesCustomers;

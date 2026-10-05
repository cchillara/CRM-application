import {
  Building2,
  CreditCard,
  Headphones,
  LogOut,
  ShieldCheck,
  UserPlus,
  Users
} from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import DetailsModal from "../components/DetailsModal";
import Status from "../components/Status";
import { organizations, tickets } from "../data";

const activity = [
  ["Organization activated", "Vertex Commerce", "20 min ago"],
  ["Subscription renewed", "ABC Technologies", "1 hr ago"],
  ["New organization registered", "BlueOrbit Systems", "3 hrs ago"],
  ["Support ticket updated", "TICK-8091", "5 hrs ago"]
];

export default function Dashboard() {
  const navigate = useNavigate();
  const [details, setDetails] = useState(null);

  const cards = [
    ["Organizations", "128", "119 active", Building2, "blue",
      [["Total", "128"], ["Active", "119"], ["Pending", "4"], ["Suspended", "5"]]],
    ["Active Users", "2,450", "+8.1% this month", Users, "green",
      [["Active Users", "2,450"], ["Organization Admins", "128"], ["Managers", "534"], ["Sales Reps", "1,788"]]],
    ["Subscriptions", "112", "87.5% conversion", CreditCard, "orange",
      [["Active", "112"], ["Starter", "41"], ["Growth", "52"], ["Pro", "35"]]],
    ["Open Tickets", "7", "2 high priority", Headphones, "red",
      [["Open Tickets", "7"], ["High Priority", "2"], ["In Progress", "3"], ["Waiting", "2"]]]
  ];

  function logout() {
    localStorage.clear();
    sessionStorage.clear();
    window.location.href = "/login";
  }

  return (
    <>
      <section className="overview-top">
        <div>
          <h2>Platform Overview</h2>
          <p>SHNOOR CRM · Super Admin</p>
        </div>

        <div className="overview-actions">
          <div className="platform-status">
            <ShieldCheck size={18} />
            <div>
              <span>Platform status</span>
              <strong>Operational</strong>
            </div>
          </div>

          <button className="logout-button" onClick={logout}>
            <LogOut size={16} />
            Log out
          </button>
        </div>
      </section>

      <section className="stats-grid">
        {cards.map(([label, value, helper, Icon, tone, rows]) => (
          <button
            className={`stat-card ${tone}`}
            key={label}
            onClick={() => setDetails({ title: label, rows })}
          >
            <div className="stat-card-top">
              <span>{label}</span>
              <div className="stat-icon"><Icon size={19} /></div>
            </div>
            <strong>{value}</strong>
            <small>{helper}</small>
          </button>
        ))}
      </section>

      <section className="dashboard-columns">
        <div className="panel">
          <div className="panel-title">
            <div>
              <h3>Recent Organizations</h3>
              <p>Latest customer organizations</p>
            </div>
            <button className="text-button" onClick={() => navigate("/organizations")}>View all</button>
          </div>

          <div className="list">
            {organizations.slice(0, 4).map((org) => (
              <button
                className="list-row"
                key={org.id}
                onClick={() => setDetails({
                  title: org.name,
                  rows: [
                    ["Organization ID", org.id],
                    ["Admin", org.admin],
                    ["Plan", org.plan],
                    ["Users", String(org.users)],
                    ["Status", org.status]
                  ]
                })}
              >
                <div className="list-main">
                  <div className="org-mark">{org.name.slice(0, 2).toUpperCase()}</div>
                  <div>
                    <strong>{org.name}</strong>
                    <span>{org.admin} · {org.plan}</span>
                  </div>
                </div>
                <Status value={org.status} />
              </button>
            ))}
          </div>
        </div>

        <div className="panel">
          <div className="panel-title">
            <div>
              <h3>Support Queue</h3>
              <p>Latest open tickets</p>
            </div>
            <button className="text-button" onClick={() => navigate("/support")}>View all</button>
          </div>

          <div className="list">
            {tickets.map((ticket) => (
              <button
                className="list-row support-row"
                key={ticket.id}
                onClick={() => setDetails({
                  title: ticket.id,
                  rows: [
                    ["Subject", ticket.subject],
                    ["Organization", ticket.organization],
                    ["Priority", ticket.priority],
                    ["Status", ticket.status]
                  ]
                })}
              >
                <div>
                  <strong>{ticket.subject}</strong>
                  <span>{ticket.organization}</span>
                </div>
                <Status value={ticket.status} />
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="dashboard-bottom-grid">
        <div className="panel">
          <div className="panel-title">
            <div>
              <h3>Quick Actions</h3>
              <p>Common admin tasks</p>
            </div>
          </div>

          <div className="quick-actions">
            <button onClick={() => navigate("/organizations")}>
              <Building2 size={18} />
              <div><strong>Organizations</strong><span>Review tenant accounts</span></div>
            </button>
            <button onClick={() => navigate("/users")}>
              <UserPlus size={18} />
              <div><strong>Users</strong><span>Review platform users</span></div>
            </button>
            <button onClick={() => navigate("/subscriptions")}>
              <CreditCard size={18} />
              <div><strong>Subscriptions</strong><span>Check plans and billing</span></div>
            </button>
          </div>
        </div>

        <div className="panel">
          <div className="panel-title">
            <div>
              <h3>Subscription Mix</h3>
              <p>Organizations by plan</p>
            </div>
          </div>

          <div className="plan-mix">
            {[
              ["Starter", "41", "32%"],
              ["Growth", "52", "41%"],
              ["Pro", "35", "27%"]
            ].map(([name, count, width]) => (
              <div className="mix-row" key={name}>
                <div><span>{name}</span><strong>{count}</strong></div>
                <div className="mix-track"><span style={{ width }} /></div>
              </div>
            ))}
          </div>
        </div>

        <div className="panel recent-activity-panel">
          <div className="panel-title">
            <div>
              <h3>Recent Activity</h3>
              <p>Latest platform events</p>
            </div>
            <button className="text-button" onClick={() => navigate("/audit-logs")}>Audit logs</button>
          </div>

          <div className="activity-list">
            {activity.map(([title, text, time]) => (
              <div className="activity-item" key={title + time}>
                <div className="activity-dot" />
                <div><strong>{title}</strong><span>{text}</span></div>
                <small>{time}</small>
              </div>
            ))}
          </div>
        </div>
      </section>

      <DetailsModal
        title={details?.title}
        rows={details?.rows || []}
        onClose={() => setDetails(null)}
      />
    </>
  );
}

import {
  BarChart3,
  Building2,
  CreditCard,
  Headphones,
  LayoutDashboard,
  ScrollText,
  Settings,
  Users
} from "lucide-react";
import { NavLink } from "react-router-dom";

const items = [
  { label: "Overview", path: "/", icon: LayoutDashboard, end: true },
  { label: "Organizations", path: "/organizations", icon: Building2 },
  { label: "Users", path: "/users", icon: Users },
  { label: "Subscriptions", path: "/subscriptions", icon: CreditCard },
  { label: "Analytics", path: "/analytics", icon: BarChart3 },
  { label: "Audit Logs", path: "/audit-logs", icon: ScrollText },
  { label: "Support", path: "/support", icon: Headphones },
  { label: "Settings", path: "/settings", icon: Settings }
];

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-logo">S</div>
        <div>
          <strong>SHNOOR</strong>
          <span>Super Admin</span>
        </div>
      </div>

      <nav className="nav">
        {items.map(({ label, path, icon: Icon, end }) => (
          <NavLink
            key={path}
            to={path}
            end={end}
            className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
          >
            <Icon size={18} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-user">
        <div className="avatar">SA</div>
        <div>
          <strong>Super Admin</strong>
          <span>Platform Admin</span>
        </div>
      </div>
    </aside>
  );
}

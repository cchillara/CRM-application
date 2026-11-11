import {
  BarChart3,
  Building2,
  CreditCard,
  Headphones,
  LayoutDashboard,
  ScrollText,
  Settings
} from "lucide-react";
import { NavLink } from "react-router-dom";

const items = [
  { label: "Overview", path: "/super-admin/", icon: LayoutDashboard, end: true },
  { label: "Organizations", path: "/super-admin/organizations", icon: Building2 },
  { label: "Subscriptions", path: "/super-admin/subscriptions", icon: CreditCard },
  { label: "Analytics", path: "/super-admin/analytics", icon: BarChart3 },
  { label: "Audit Logs", path: "/super-admin/audit-logs", icon: ScrollText },
  { label: "Support & Help", path: "/super-admin/support", icon: Headphones },
  { label: "Settings", path: "/super-admin/settings", icon: Settings }
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
    </aside>
  );
}

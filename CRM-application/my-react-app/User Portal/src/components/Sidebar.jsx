import { ChevronDown } from "lucide-react";
import { navItems } from "../data/navigation";
import { usePortal } from "../context/PortalContext";

export default function Sidebar() {
  const { page, navigate, mobileNav, setMobileNav, account, collapsed, unreadNotificationCount } = usePortal();
  const initials = account.name.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase();

  return <>
    {mobileNav && <button className="mobile-backdrop" aria-label="Close navigation" onClick={() => setMobileNav(false)} />}
    <aside className={`sidebar ${mobileNav ? "mobile-open" : ""}`}>
      <div className="brand"><div className="brand-logo">S</div><div><strong>SHNOOR</strong><span>User Portal</span></div></div>
      <div className="nav-caption">WORKSPACE</div>
      <nav className="nav" aria-label="Main navigation">{navItems.map(({ label, icon: Icon, badge }) => <button key={label} className={`nav-link ${page === label ? "active" : ""}`} onClick={() => navigate(label)} title={collapsed ? label : undefined}>
        <Icon size={18} /><span>{label}</span>{label === "Notifications" ? unreadNotificationCount > 0 && <b className="nav-badge" aria-label={`${unreadNotificationCount} unread notifications`} title={`${unreadNotificationCount} unread notifications`}>{unreadNotificationCount}</b> : badge && <b className="nav-badge">{badge}</b>}
      </button>)}</nav>
      <div className="sidebar-spacer" />
      <button type="button" className="sidebar-user" onClick={() => navigate("Account")} aria-label="Open account details"><span className="user-avatar">{initials}</span><span className="sidebar-user-copy"><strong>{account.name}</strong><span>{account.role}</span></span><span className="sidebar-user-menu"><ChevronDown size={16} /></span></button>
    </aside>
  </>;
}

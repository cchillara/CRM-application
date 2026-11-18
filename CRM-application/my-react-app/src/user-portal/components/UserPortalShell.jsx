import { useEffect } from "react";
import { ArrowLeft, ArrowRight, Calendar, LogOut, Menu, User } from "lucide-react";
import ClientThemeToggle from "../../client-admin-portal/components/ThemeToggle.jsx";
import { navItems } from "../data/navigation.js";
import { usePortal } from "../context/PortalContext.jsx";

export default function UserPortalShell({ title, description, showHeading = true, children }) {
  const { page, navigate, collapsed, setCollapsed, mobileNav, setMobileNav, logout, unreadNotificationCount, theme } = usePortal();
  const sidebarOpen = !collapsed || mobileNav;

  useEffect(() => {
    if (window.innerWidth <= 768) setCollapsed(true);
  }, [setCollapsed]);

  function closeMobileNav() {
    setMobileNav(false);
    setCollapsed(true);
  }
  function collapseSidebar() {
    setCollapsed(true);
    if (window.innerWidth <= 768) setMobileNav(false);
  }

  return <div className="portal user-portal-root" data-theme={theme}>
    <div className={`crm-portal-container ${sidebarOpen ? "sidebar-open" : "sidebar-closed"}`} data-theme={theme}>
    <header className="crm-top-header-bar">
      <div className="crm-top-header-left">
        <button type="button" className="crm-hamburger-btn user-mobile-menu" aria-label="Open navigation" onClick={() => setMobileNav(true)}><Menu size={20} /></button>
      </div>
      <div className="crm-top-header-actions">
        <ClientThemeToggle />
        <button type="button" className="crm-banner-btn" title="Calendar" aria-label="Calendar" onClick={() => navigate("Calendar")}><Calendar size={18} /></button>
        <button type="button" className="crm-header-icon-btn" title="Profile" aria-label="Profile" onClick={() => navigate("Account")}><User size={18} /></button>
        <button type="button" className="crm-header-logout-btn" onClick={logout} title="Log out"><LogOut size={16} /><span>Log out</span></button>
      </div>
    </header>
    {mobileNav && <div className="crm-sidebar-backdrop" aria-hidden="true" onClick={closeMobileNav} />}
    <aside className={`crm-sidebar ${sidebarOpen ? "open" : "collapsed"}`} aria-label="Main Navigation">
      <div className={`crm-brand-header ${!sidebarOpen ? "collapsed" : ""}`}>
        {sidebarOpen ? <>
          <div className="user-brand-lockup"><div className="crm-brand-logo"><span>S</span></div><div className="crm-brand-details"><h2 className="crm-brand-name">SHNOOR</h2><span className="crm-brand-role">User Portal</span></div></div>
          <button type="button" className="crm-sidebar-toggle-btn" onClick={collapseSidebar} aria-label="Collapse navigation" title="Collapse sidebar"><ArrowLeft size={18} /></button>
        </> : <button type="button" className="crm-sidebar-collapsed-toggle-btn" onClick={() => { setCollapsed(false); setMobileNav(false); }} aria-label="Expand navigation" title="Expand sidebar"><ArrowRight size={18} /></button>}
      </div>
      <nav className="crm-nav-container" aria-label="User workspace">
        <ul className="crm-nav-list">{navItems.map(({ label, icon: Icon }) => <li className="crm-nav-item" key={label}><button type="button" className={`crm-nav-btn ${page === label ? "active" : ""}`} onClick={() => { navigate(label); if (window.innerWidth <= 768) closeMobileNav(); }} title={label}><span className="crm-nav-icon-wrapper"><Icon size={20} strokeWidth={2} /></span><span className="crm-nav-label">{label}</span>{label === "Notifications" && unreadNotificationCount > 0 && <span className={`crm-nav-badge ${page === label ? "active-badge" : ""}`}>{unreadNotificationCount}</span>}</button></li>)}</ul>
      </nav>
    </aside>
    <main className="crm-main-viewport">
      <div className="crm-dashboard user-portal-content">
          {showHeading && <div className="crm-top-header user-page-heading"><div><h1 className="crm-page-title">{title}</h1><p className="crm-page-subtitle">{description}</p></div></div>}
          {children}
      </div>
    </main>
    </div>
  </div>;
}

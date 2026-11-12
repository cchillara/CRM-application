import { useState } from "react";
import { CircleUserRound, LogOut, Menu, Moon, Search, Sun, X } from "lucide-react";
import { usePortal } from "../context/PortalContext";

export default function Header() {
  const { collapsed, setCollapsed, setMobileNav, theme, toggleTheme, navigate, logout } = usePortal();
  const [query, setQuery] = useState("");
  return <header className="header">
    <div className="header-title-group">
      <button type="button" className="header-sidebar-toggle desktop-toggle" onClick={() => setCollapsed((value) => !value)} aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}><Menu size={20} /></button>
      <button type="button" className="header-sidebar-toggle mobile-toggle" onClick={() => setMobileNav(true)} aria-label="Open navigation"><Menu size={20} /></button>
      <div><h1>SHNOOR CRM</h1><span className="header-subtitle">User workspace</span></div>
    </div>
    <div className="header-actions">
      <label className="search-box"><Search size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search anything..." aria-label="Search" />{query && <button type="button" aria-label="Clear search" onClick={() => setQuery("")}><X size={14} /></button>}<kbd>⌘ K</kbd></label>
      <button type="button" className="header-theme-toggle" onClick={toggleTheme} aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`} title={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}>{theme === "dark" ? <Sun size={19} /> : <Moon size={19} />}</button>
      <button type="button" className="header-user-button" aria-label="Open account page" onClick={() => navigate("Account")}><CircleUserRound size={20} /></button>
      <button type="button" className="logout-button" onClick={logout}><LogOut size={15} /><span>Log out</span></button>
    </div>
  </header>;
}

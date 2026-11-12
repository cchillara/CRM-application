import { createContext, useContext, useMemo, useState } from "react";

const PortalContext = createContext(null);
const defaultNotifications = [
  { id: "n1", title: "Lead qualified", detail: "Acme Corporation moved to Qualified", time: "24 min ago", iconName: "lead", tone: "green" },
  { id: "n2", title: "Deal updated", detail: "Northwind renewal · $18,200", time: "1 hr ago", iconName: "deal", tone: "blue" },
  { id: "n3", title: "Meeting scheduled", detail: "Discovery call with Globex Solutions", time: "3 hrs ago", iconName: "calendar", tone: "purple" },
  { id: "n4", title: "Task due today", detail: "Send revised proposal to Acme Corp.", time: "Yesterday", iconName: "task", tone: "orange" }
];

function readProfile() {
  try { return JSON.parse(localStorage.getItem("shnoorUserProfile") || "{}"); }
  catch { return {}; }
}

function readNotifications() {
  try {
    const saved = JSON.parse(localStorage.getItem("shnoorUserNotices") || "null");
    return Array.isArray(saved) ? saved : defaultNotifications;
  } catch { return defaultNotifications; }
}

export function PortalProvider({ children }) {
  const saved = useMemo(readProfile, []);
  const [page, setPage] = useState("Dashboard");
  const [collapsed, setCollapsed] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem("shnoorAdminTheme") === "dark" ? "dark" : "light");
  const [notifications, setNotifications] = useState(readNotifications);
  const unreadNotificationCount = notifications.filter((notice) => !notice.read).length;
  const [account, setAccount] = useState({
    name: saved.name || "Alex Morgan",
    email: saved.email || "alex.morgan@shnoor.com",
    role: saved.role || "Sales Representative"
  });

  function navigate(nextPage) {
    setPage(nextPage);
    setMobileNav(false);
  }

  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("shnoorAdminTheme", next);
  }

  function saveNotifications(notifications) {
    const safeNotifications = Array.isArray(notifications) ? notifications : [];
    localStorage.setItem("shnoorUserNotices", JSON.stringify(safeNotifications));
    setNotifications(safeNotifications);
  }

  function logout() {
    ["superAdminToken", "superAdminUser", "shnoorSuperAdminToken", "shnoorSuperAdminUser", "token", "firebaseToken"].forEach((key) => localStorage.removeItem(key));
    sessionStorage.clear();
    window.location.href = import.meta.env.VITE_LOGIN_URL || "http://localhost:5173/login";
  }

  const value = {
    page, navigate, collapsed, setCollapsed, mobileNav, setMobileNav,
    theme, toggleTheme, account, setAccount, logout,
    notifications, unreadNotificationCount, saveNotifications
  };
  return <PortalContext.Provider value={value}>{children}</PortalContext.Provider>;
}

export function usePortal() {
  const context = useContext(PortalContext);
  if (!context) throw new Error("usePortal must be used within PortalProvider");
  return context;
}

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { signOut } from "firebase/auth";
import { auth } from "../../firebase.js";
import { getNotifications, getProfile, markNotificationRead } from "../api/userPortalApi.js";

const PortalContext = createContext(null);
function readProfile() { try { return JSON.parse(localStorage.getItem("shnoorUserProfile") || "{}"); } catch { return {}; } }
const normalizeTheme = (value) => ({ dark: "black", light: "white" }[value] || (["white", "black", "blue"].includes(value) ? value : "white"));

export function PortalProvider({ children }) {
  const saved = useMemo(readProfile, []);
  const [page, setPage] = useState("Dashboard");
  const [collapsed, setCollapsed] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);
  const [theme, setTheme] = useState(() => normalizeTheme(localStorage.getItem("crm-theme") || document.documentElement.getAttribute("data-theme")));
  const [notifications, setNotifications] = useState([]);
  const [notificationsError, setNotificationsError] = useState("");
  const [account, setAccount] = useState({ name: saved.name || "User", email: saved.email || "", role: saved.role || "USER", phone: saved.phone || "", designation: saved.designation || "", orgName: saved.orgName || "" });
  const [profileError, setProfileError] = useState("");
  const unreadNotificationCount = notifications.filter((notice) => !notice.read).length;

  useEffect(() => {
    let active = true;
    getProfile().then((profile) => {
      if (!active || !profile) return;
      setAccount((current) => ({ ...current, ...profile }));
      localStorage.setItem("shnoorUserProfile", JSON.stringify(profile));
      setProfileError("");
    }).catch((error) => { if (active) setProfileError(error.message || "Could not load your profile."); });
    getNotifications().then((items) => {
      if (!active) return;
      const rows = Array.isArray(items) ? items : items?.items || [];
      setNotifications(rows.map((item) => ({ id: item.id, title: item.title || "CRM update", detail: item.message || "", time: item.createdAt ? new Date(item.createdAt).toLocaleString() : "", read: Boolean(item.isRead), iconName: item.type?.toLowerCase() || "lead", tone: item.isRead ? "blue" : "green" })));
      setNotificationsError("");
    }).catch((error) => { if (active) { setNotifications([]); setNotificationsError(error.message || "Could not load notifications."); } });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    document.body.className = `theme-${theme}`;
    localStorage.setItem("crm-theme", theme);
    const syncTheme = (event) => {
      const next = event.type === "storage" ? event.newValue : event.detail;
      if (next) setTheme(normalizeTheme(next));
    };
    window.addEventListener("crm-theme-changed", syncTheme);
    window.addEventListener("storage", syncTheme);
    return () => {
      window.removeEventListener("crm-theme-changed", syncTheme);
      window.removeEventListener("storage", syncTheme);
    };
  }, [theme]);

  function navigate(nextPage) { setPage(nextPage); setMobileNav(false); }
  function toggleTheme() {
    const themes = ["white", "black", "blue"];
    const next = themes[(themes.indexOf(theme) + 1) % themes.length];
    setTheme(next);
    window.dispatchEvent(new CustomEvent("crm-theme-changed", { detail: next }));
  }
  function selectTheme(nextTheme) {
    const next = normalizeTheme(nextTheme);
    setTheme(next);
    window.dispatchEvent(new CustomEvent("crm-theme-changed", { detail: next }));
  }
  async function saveNotifications(next) {
    const newlyRead = notifications.filter((item) => !item.read && next.some((candidate) => candidate.id === item.id && candidate.read));
    setNotifications(next);
    const realReads = newlyRead;
    const results = await Promise.allSettled(realReads.map((item) => markNotificationRead(item.id)));
    const failed = realReads.filter((item, index) => results[index]?.status === "rejected");
    if (failed.length) {
      setNotifications((current) => current.map((item) => failed.some((read) => read.id === item.id) ? { ...item, read: false } : item));
      setNotificationsError("Some notifications could not be marked as read. Please try again.");
    } else setNotificationsError("");
  }
  async function logout() {
    try { if (auth) await signOut(auth); } finally {
      ["token", "firebaseToken", "shnoorUserProfile", "shnoorUserNotices", "shnoorTemporaryUserSession"].forEach((key) => localStorage.removeItem(key));
      window.location.assign("/login");
    }
  }

  const value = { page, navigate, collapsed, setCollapsed, mobileNav, setMobileNav, theme, toggleTheme, selectTheme, account, setAccount, logout, notifications, notificationsError, unreadNotificationCount, saveNotifications, profileError };
  return <PortalContext.Provider value={value}>{children}</PortalContext.Provider>;
}

export function usePortal() {
  const context = useContext(PortalContext);
  if (!context) throw new Error("usePortal must be used within PortalProvider");
  return context;
}

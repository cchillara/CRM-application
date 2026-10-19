import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { useEffect, useState } from "react";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Organizations from "./pages/Organizations";
import OrganizationDetails from "./pages/OrganizationDetails";
import Subscriptions from "./pages/Subscriptions";
import Analytics from "./pages/Analytics";
import AuditLogs from "./pages/AuditLogs";
import Support from "./pages/Support";
import Settings from "./pages/Settings";
import { superAdminRequest } from "./api/superAdminApi";

const LOGIN_URL = import.meta.env.VITE_LOGIN_URL || "http://localhost:5173/login";

function ProtectedLayout() {
  const [authorized, setAuthorized] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("shnoorSuperAdminToken") || localStorage.getItem("superAdminToken");
    if (!token) {
      window.location.replace(LOGIN_URL);
      return;
    }

    let active = true;
    superAdminRequest("/organizations")
      .then(() => { if (active) setAuthorized(true); })
      .catch((error) => {
        if (!active) return;
        if (error.status === 401 || error.status === 403) {
          ["superAdminToken", "superAdminUser", "shnoorSuperAdminToken", "shnoorSuperAdminUser"].forEach((key) => localStorage.removeItem(key));
          window.location.replace(LOGIN_URL);
        } else {
          setAuthorized(true);
        }
      })
      .finally(() => { if (active) setChecking(false); });
    return () => { active = false; };
  }, []);

  if (checking || !authorized) return <div className="form-note">Verifying Super Admin access…</div>;
  return <Layout />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<ProtectedLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="organizations" element={<Organizations />} />
          <Route path="organizations/:organizationId" element={<OrganizationDetails />} />
          <Route path="subscriptions" element={<Subscriptions />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="audit-logs" element={<AuditLogs />} />
          <Route path="support" element={<Support />} />
          <Route path="settings" element={<Settings />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

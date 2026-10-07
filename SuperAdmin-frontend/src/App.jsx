import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Organizations from "./pages/Organizations";
import Users from "./pages/Users";
import Subscriptions from "./pages/Subscriptions";
import Analytics from "./pages/Analytics";
import AuditLogs from "./pages/AuditLogs";
import Support from "./pages/Support";
import Settings from "./pages/Settings";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="organizations" element={<Organizations />} />
          <Route path="users" element={<Users />} />
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

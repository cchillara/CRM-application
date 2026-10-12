import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import ClientLayout from "./ClientLayout";
import Dashboard from "./pages/Dashboard";
import Leads from "./pages/Leads";
import Deals from "./pages/Deals";
import Tasks from "./pages/Tasks";
import Team from "./pages/Teams";
import Products from "./pages/Products";
import Employee from "./pages/Employee";
import Settings from "./pages/Settings";
import "./Client-admin.css"

export default function ClientAdminRoutes() {
  return (
    <Routes>
      <Route element={<ClientLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="leads" element={<Leads />} />
        <Route path="deals" element={<Deals />} />
        <Route path="tasks" element={<Tasks />} />
        <Route path="team" element={<Team />} />
        <Route path="products" element={<Products />} />
        <Route path="employee" element={<Employee />} />
        <Route path="settings" element={<Settings />} />
      </Route>

      <Route path="*" element={<Navigate to="" replace />} />
    </Routes>
  );
}

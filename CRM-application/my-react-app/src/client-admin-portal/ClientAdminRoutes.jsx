import { Navigate, Route, Routes, Outlet } from "react-router-dom";
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase";
import ClientLayout from "./ClientLayout";
import Dashboard from "./pages/Dashboard";
import Leads from "./pages/Leads";
import Deals from "./pages/Deals";
import Tasks from "./pages/Tasks";
import Team from "./pages/Teams";
import Products from "./pages/Products";
import Employee from "./pages/Employee";
import Settings from "./pages/Settings";
import Calendar from "./pages/Calendar";
import Profile from "./pages/Profile";
import "./Client-admin.css"

function RequireAuthentication() {
  const [user, setUser] = useState(undefined);

  useEffect(() => onAuthStateChanged(auth, setUser), []);

  if (user === undefined) {
    return <div role="status" aria-live="polite">Checking your session…</div>;
  }

  return user ? <Outlet /> : <Navigate to="/login" replace />;
}

export default function ClientAdminRoutes() {
  return (
    <Routes>
      <Route element={<RequireAuthentication />}>
        <Route element={<ClientLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="leads" element={<Leads />} />
        <Route path="deals" element={<Deals />} />
        <Route path="tasks" element={<Tasks />} />
        <Route path="team" element={<Team />} />
        <Route path="calendar" element={<Calendar />} />
        <Route path="profile" element={<Profile/>}/>
        <Route path="products" element={<Products />} />
        <Route path="employee" element={<Employee />} />
        <Route path="settings" element={<Settings />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="" replace />} />
    </Routes>
  );
}

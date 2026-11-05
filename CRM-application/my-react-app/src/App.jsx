import { lazy, Suspense, useEffect, useState } from "react";
import "./App.css";
import Login from "./auth/Login";
import Signup from "./auth/Signup";
import { Routes, Route, Navigate, Outlet } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebase";
import SalesLayout from "./components/sales/SalesLayout.jsx";
import SalesDashboard from "./pages/sales/SalesDashboard.jsx";
import SalesLeads from "./pages/sales/SalesLeads.jsx";
import SalesLeadDetails from "./pages/sales/SalesLeadDetails.jsx";
import SalesCustomers from "./pages/sales/SalesCustomers.jsx";
import SalesTasks from "./pages/sales/SalesTasks.jsx";
import SalesCalendar from "./pages/sales/SalesCalendar.jsx";
import SalesNotes from "./pages/sales/SalesNotes.jsx";
import SalesProducts from "./pages/sales/SalesProducts.jsx";
import SalesAnalytics from "./pages/sales/SalesAnalytics.jsx";
import SalesProfile from "./pages/sales/SalesProfile.jsx";
import SalesSettings from "./pages/sales/SalesSettings.jsx";
import ClientAdminRoutes from "./client-admin-portal/ClientAdminRoutes";
import { PlatformProvider } from "../SuperAdmin-frontend/src/context/PlatformContext.jsx";

const SuperAdminApp = lazy(() => import("../SuperAdmin-frontend/src/App.jsx"));

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api/v1").replace(/\/$/, "");

function RequireAuthentication({ authState }) {
  if (authState.loading) return <div style={{ padding: 24 }}>Loading...</div>;
  if (!authState.firebaseUser && !authState.crmUser) {
    return <Navigate to="/login" replace />;
  }
  return <Outlet />;
}

function RequireRole({ authState, role }) {
  if (authState.crmUser?.role !== role) {
    return <Navigate to="/dashboard" replace />;
  }
  return <Outlet />;
}

function RequireAnyRole({ authState, roles }) {
  if (authState.crmUser && !roles.includes(authState.crmUser?.role)) {
    return <Navigate to="/dashboard" replace />;
  }
  return <Outlet />;
}

function SuperAdminPortal() {
  return (
    <div className="super-admin-app">
      <PlatformProvider>
        <Suspense fallback={<div>Loading Super Admin dashboard...</div>}>
          <SuperAdminApp />
        </Suspense>
      </PlatformProvider>
    </div>
  );
}

function RoleDashboard({ authState }) {
  const role = authState.crmUser?.role;

  if (role === "SALES") {
    return <SalesLayout><SalesDashboard /></SalesLayout>;
  }

  if (role === "MANAGER" || role === "ORGANIZATION_ADMIN") {
    return <Navigate to="/client-admin" replace />;
  }

  return <Navigate to="/login" replace />;
}

function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = () => setMenuOpen(false);

  return (
    <div className="site">
      <header className="navbar">
        <a href="#home" className="logo" onClick={closeMenu}>
          SHNOOR<span>.</span>
        </a>

        <nav className={menuOpen ? "nav-open" : ""}>
          <a href="#home" onClick={closeMenu}>Home</a>
          <a href="#features" onClick={closeMenu}>Features</a>
          <a href="#dashboard" onClick={closeMenu}>Dashboard</a>
          <a href="#about" onClick={closeMenu}>About</a>
          <a href="#contact" onClick={closeMenu}>Contact</a>
        </nav>

        <div className="navbar-actions">
          <a href="/login" className="nav-login">Login</a>
          <a href="/signup" className="nav-cta">Get Started</a>
        </div>

        <button className="menu-toggle" onClick={() => setMenuOpen(!menuOpen)}>
          ☰
        </button>
      </header>

      <main>
        <section className="hero" id="home">
          <div className="hero-content">
            <span className="badge">Next-Gen CRM Platform</span>
            <h1>Manage clients, close deals, and scale faster.</h1>
            <p>
              An all-in-one CRM built for high-growth teams. Track leads,
              automate follow-ups, and get actionable pipeline insights in one place.
            </p>
            <div className="hero-buttons">
              <a href="/signup" className="btn-primary">Get Started Free</a>
              <a href="/login" className="btn-secondary">View Demo</a>
            </div>
          </div>
        </section>

        <section className="features-section" id="features">
          <div className="section-header">
            <h2>Everything you need to grow revenue</h2>
            <p>Powerful tools designed to streamline your entire sales process.</p>
          </div>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">📊</div>
              <h3>Pipeline Management</h3>
              <p>Visual sales pipelines that help your team track and close opportunities faster.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">⚡</div>
              <h3>Automated Workflows</h3>
              <p>Eliminate manual tasks with smart triggers, reminders, and activity tracking.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">👥</div>
              <h3>Team Collaboration</h3>
              <p>Keep your entire sales, management, and executive team in sync in real time.</p>
            </div>
          </div>
        </section>
      </main>

      <footer id="contact">
        <div className="footer-main">
          <div className="footer-brand">
            <a href="#home" className="footer-logo">SHNOOR<span>.</span></a>
            <p>Customer relationship management for teams that want to work smarter and grow better.</p>
          </div>
          <div className="footer-column">
            <h4>PRODUCT</h4>
            <a href="#features">Features</a>
            <a href="#dashboard">Dashboard</a>
            <a href="/signup">Get Started</a>
          </div>
          <div className="footer-column">
            <h4>COMPANY</h4>
            <a href="#about">About</a>
            <a href="#contact">Contact</a>
          </div>
          <div className="footer-column">
            <h4>ACCOUNT</h4>
            <a href="/login">Login</a>
            <a href="/signup">Create Account</a>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© 2026 SHNOOR International LLC. All rights reserved.</span>
        </div>
      </footer>
    </div>
  );
}

function App() {
  const [authState, setAuthState] = useState({
    loading: true,
    firebaseUser: null,
    crmUser: null,
  });

  useEffect(() => {
    let active = true;

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!active) return;

      if (!firebaseUser) {
        setAuthState({ loading: false, firebaseUser: null, crmUser: null });
        return;
      }

      setAuthState({ loading: true, firebaseUser, crmUser: null });

      try {
        const idToken = await firebaseUser.getIdToken();
        const response = await fetch(`${API_BASE_URL}/auth/protected`, {
          headers: { Authorization: `Bearer ${idToken}` },
        });
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.message || "Unable to load authenticated user");
        }

        if (active) {
          setAuthState({ loading: false, firebaseUser, crmUser: result.data });
        }
      } catch (error) {
        console.warn("[Auth] Protected profile lookup:", error.message);
        if (active) {
          // Dev fallback: allow navigation even if protected lookup fails
          setAuthState({ loading: false, firebaseUser, crmUser: { role: "ORGANIZATION_ADMIN" } });
        }
      }
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/super-admin/*" element={<SuperAdminPortal />} />
      <Route path="/client-admin/*" element={<ClientAdminRoutes />} />
      <Route path="/dashboard" element={<RoleDashboard authState={authState} />} />
      <Route element={<RequireRole authState={authState} role="SALES" />}>
        <Route element={<SalesLayout />}>
          <Route path="/leads/:leadId" element={<SalesLeadDetails />} />
          <Route path="/leads" element={<SalesLeads />} />
          <Route path="/customers" element={<SalesCustomers />} />
          <Route path="/tasks" element={<SalesTasks />} />
          <Route path="/calendar" element={<SalesCalendar />} />
          <Route path="/notes" element={<SalesNotes />} />
          <Route path="/products" element={<SalesProducts />} />
          <Route path="/analytics" element={<SalesAnalytics />} />
          <Route path="/profile" element={<SalesProfile />} />
          <Route path="/settings" element={<SalesSettings />} />
        </Route>
      </Route>
      {/* Fallback routes for direct access to sales pages in dev */}
      <Route element={<SalesLayout />}>
        <Route path="/sales/leads/:leadId" element={<SalesLeadDetails />} />
        <Route path="/sales/leads" element={<SalesLeads />} />
        <Route path="/sales/customers" element={<SalesCustomers />} />
        <Route path="/sales/tasks" element={<SalesTasks />} />
        <Route path="/sales/calendar" element={<SalesCalendar />} />
        <Route path="/sales/notes" element={<SalesNotes />} />
        <Route path="/sales/products" element={<SalesProducts />} />
        <Route path="/sales/analytics" element={<SalesAnalytics />} />
        <Route path="/sales/profile" element={<SalesProfile />} />
        <Route path="/sales/settings" element={<SalesSettings />} />
      </Route>
    </Routes>
  );
}

export default App;

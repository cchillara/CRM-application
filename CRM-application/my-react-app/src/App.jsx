import { useState } from "react";
import "./App.css";
import Login from "./auth/Login";
import Signup from "./auth/Signup";

function App() {
  const path = window.location.pathname;
  const [menuOpen, setMenuOpen] = useState(false);

  if (path === "/login") {
    return <Login />;
  }

  if (path === "/signup") {
    return <Signup />;
  }

  const closeMenu = () => setMenuOpen(false);

  return (
    <div className="site">
      {/* ================= HEADER ================= */}
      <header className="navbar">
        <a href="#home" className="logo" onClick={closeMenu}>
          SHNOOR<span>.</span>
        </a>

        <nav className={menuOpen ? "nav-open" : ""}>
          <a href="#home" onClick={closeMenu}>
            Home
          </a>

          <a href="#features" onClick={closeMenu}>
            Features
          </a>

          <a href="#dashboard" onClick={closeMenu}>
            Dashboard
          </a>

          <a href="#about" onClick={closeMenu}>
            About
          </a>

          <a href="#contact" onClick={closeMenu}>
            Contact
          </a>
        </nav>

        <div className="navbar-actions">
          <a href="/login" className="nav-login">
            Login
          </a>

          <a href="/signup" className="nav-cta">
            Get Started
          </a>
        </div>

        <button
          className="menu-toggle"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle navigation"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
      </header>

      {/* ================= HERO ================= */}
      <main>
        <section className="hero" id="home">
          <div className="hero-content">
            <div className="hero-badge">
              <span className="badge-dot"></span>
              CUSTOMER RELATIONSHIP MANAGEMENT
            </div>

            <h1>
              Build stronger
              <span> customer relationships.</span>
            </h1>

            <p className="hero-description">
              SHNOOR gives your team one organized workspace to manage
              customers, track leads, monitor deals and understand your
              business.
            </p>

            <div className="hero-buttons">
              <a href="/signup" className="primary-button">
                Get Started
                <span>→</span>
              </a>

              <a href="#features" className="secondary-button">
                Explore Features
              </a>
            </div>

            <div className="hero-points">
              <div>
                <span className="check">✓</span>
                Customer Management
              </div>

              <div>
                <span className="check">✓</span>
                Lead Tracking
              </div>

              <div>
                <span className="check">✓</span>
                Sales Insights
              </div>
            </div>
          </div>

          {/* ================= DASHBOARD PREVIEW ================= */}
          <div className="hero-dashboard-wrapper">
            <div className="dashboard-glow"></div>

            <div className="hero-dashboard">
              <div className="dashboard-sidebar">
                <div className="dashboard-logo">
                  SHNOOR<span>.</span>
                </div>

                <div className="sidebar-menu">
                  <div className="sidebar-item active">
                    <span>▦</span>
                    Dashboard
                  </div>

                  <div className="sidebar-item">
                    <span>◉</span>
                    Customers
                  </div>

                  <div className="sidebar-item">
                    <span>◇</span>
                    Leads
                  </div>

                  <div className="sidebar-item">
                    <span>▣</span>
                    Deals
                  </div>

                  <div className="sidebar-item">
                    <span>◫</span>
                    Reports
                  </div>
                </div>

                <div className="sidebar-bottom">
                  <div className="sidebar-item">
                    <span>⚙</span>
                    Settings
                  </div>
                </div>
              </div>

              <div className="dashboard-content">
                <div className="dashboard-heading">
                  <div>
                    <span>Overview</span>
                    <h3>Dashboard</h3>
                  </div>

                  <div className="dashboard-search">
                    <span>⌕</span>
                    Search
                  </div>
                </div>

                <div className="stat-grid">
                  <div className="stat-card">
                    <span>Total Customers</span>
                    <strong>1,248</strong>
                    <small className="positive">+12.5%</small>
                  </div>

                  <div className="stat-card">
                    <span>New Leads</span>
                    <strong>248</strong>
                    <small className="positive">+8.2%</small>
                  </div>

                  <div className="stat-card">
                    <span>Active Deals</span>
                    <strong>86</strong>
                    <small className="positive">+5.7%</small>
                  </div>
                </div>

                <div className="dashboard-chart">
                  <div className="chart-header">
                    <div>
                      <span>Customer Growth</span>
                      <strong>+24.8%</strong>
                    </div>

                    <span className="chart-period">
                      Last 7 months
                    </span>
                  </div>

                  <div className="chart-area">
                    <div className="chart-grid-line line-one"></div>
                    <div className="chart-grid-line line-two"></div>
                    <div className="chart-grid-line line-three"></div>

                    <div className="chart-bars">
                      <i style={{ height: "35%" }}></i>
                      <i style={{ height: "48%" }}></i>
                      <i style={{ height: "42%" }}></i>
                      <i style={{ height: "62%" }}></i>
                      <i style={{ height: "54%" }}></i>
                      <i style={{ height: "76%" }}></i>
                      <i style={{ height: "90%" }}></i>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ================= TRUST BAR ================= */}
        <section className="trust-bar">
          <p>ONE PLATFORM FOR YOUR CUSTOMER WORKFLOW</p>

          <div className="trust-items">
            <span>Customer Data</span>
            <span>Lead Management</span>
            <span>Sales Pipeline</span>
            <span>Business Reports</span>
          </div>
        </section>

        {/* ================= FEATURES ================= */}
        <section className="features section" id="features">
          <div className="section-heading">
            <span className="section-label">
              POWERFUL CRM FEATURES
            </span>

            <h2>
              Everything your team needs
              <span> in one place.</span>
            </h2>

            <p>
              Keep your customer information organized and give your
              team the tools they need to manage the entire sales
              workflow.
            </p>
          </div>

          <div className="feature-grid">
            <div className="feature-card featured">
              <div className="feature-icon blue-icon">01</div>

              <h3>Customer Management</h3>

              <p>
                Keep customer profiles, contact details and important
                information organized in one centralized workspace.
              </p>

              <a href="#dashboard">
                Explore customers <span>→</span>
              </a>
            </div>

            <div className="feature-card">
              <div className="feature-icon red-icon">02</div>

              <h3>Lead Management</h3>

              <p>
                Track leads from initial contact through conversion and
                keep your sales process organized.
              </p>

              <a href="#dashboard">
                Track leads <span>→</span>
              </a>
            </div>

            <div className="feature-card">
              <div className="feature-icon blue-icon">03</div>

              <h3>Deal Management</h3>

              <p>
                Monitor active opportunities and keep your team focused
                on the deals that matter.
              </p>

              <a href="#dashboard">
                Manage deals <span>→</span>
              </a>
            </div>

            <div className="feature-card">
              <div className="feature-icon red-icon">04</div>

              <h3>Reports & Insights</h3>

              <p>
                Get a clear overview of business activity with simple
                dashboards and useful reports.
              </p>

              <a href="#dashboard">
                View insights <span>→</span>
              </a>
            </div>
          </div>
        </section>

        {/* ================= DASHBOARD SHOWCASE ================= */}
        <section className="dashboard-section" id="dashboard">
          <div className="dashboard-showcase">
            <div className="showcase-content">
              <span className="section-label">
                A CLEAR VIEW OF YOUR BUSINESS
              </span>

              <h2>
                Know what is happening
                <span> across your CRM.</span>
              </h2>

              <p>
                SHNOOR brings customers, leads, deals and business
                activity together so your team can spend less time
                searching for information and more time building
                relationships.
              </p>

              <div className="showcase-list">
                <div>
                  <span>✓</span>
                  Customer information in one place
                </div>

                <div>
                  <span>✓</span>
                  Lead and deal tracking
                </div>

                <div>
                  <span>✓</span>
                  Business performance overview
                </div>

                <div>
                  <span>✓</span>
                  Recent activity monitoring
                </div>
              </div>

              <a
                href="/signup"
                className="primary-button showcase-button"
              >
                Start using SHNOOR
                <span>→</span>
              </a>
            </div>

            <div className="showcase-card">
              <div className="showcase-top">
                <div>
                  <span>Business Overview</span>
                  <strong>September 2026</strong>
                </div>

                <button>•••</button>
              </div>

              <div className="showcase-stats">
                <div>
                  <small>Customers</small>
                  <strong>1,248</strong>
                  <span>↑ 12.5%</span>
                </div>

                <div>
                  <small>Leads</small>
                  <strong>248</strong>
                  <span>↑ 8.2%</span>
                </div>

                <div>
                  <small>Deals</small>
                  <strong>86</strong>
                  <span>↑ 5.7%</span>
                </div>
              </div>

              <div className="activity-card">
                <div className="activity-heading">
                  <h4>Recent Activity</h4>
                  <span>View all</span>
                </div>

                <div className="activity-row">
                  <div className="activity-avatar blue-avatar">
                    JS
                  </div>

                  <div>
                    <strong>New customer added</strong>
                    <span>John Smith</span>
                  </div>

                  <small>10 min ago</small>
                </div>

                <div className="activity-row">
                  <div className="activity-avatar red-avatar">
                    SL
                  </div>

                  <div>
                    <strong>Lead converted</strong>
                    <span>Sarah Lee</span>
                  </div>

                  <small>32 min ago</small>
                </div>

                <div className="activity-row">
                  <div className="activity-avatar blue-avatar">
                    AB
                  </div>

                  <div>
                    <strong>New deal created</strong>
                    <span>Alex Brown</span>
                  </div>

                  <small>1 hour ago</small>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ================= ABOUT ================= */}
        <section className="about section" id="about">
          <div className="about-heading">
            <span className="section-label">ABOUT SHNOOR</span>

            <h2>
              Technology that helps
              <span> businesses work better.</span>
            </h2>
          </div>

          <div className="about-content">
            <p>
              SHNOOR CRM is designed to bring customer information,
              sales activities and business operations together in one
              organized workspace.
            </p>

            <div className="about-stats">
              <div>
                <strong>01</strong>
                <span>Centralized CRM</span>
              </div>

              <div>
                <strong>02</strong>
                <span>Simple Workflow</span>
              </div>

              <div>
                <strong>03</strong>
                <span>Better Visibility</span>
              </div>
            </div>
          </div>
        </section>

        {/* ================= CTA ================= */}
        <section className="cta-section">
          <div className="cta-content">
            <span className="section-label">
              GET STARTED WITH SHNOOR
            </span>

            <h2>
              Ready to manage your
              <span> business better?</span>
            </h2>

            <p>
              Bring your customers, leads and sales activities together
              with SHNOOR CRM.
            </p>

            <div className="cta-buttons">
              <a href="/signup" className="cta-primary">
                Create your account
                <span>→</span>
              </a>

              <a href="/login" className="cta-secondary">
                Sign in
              </a>
            </div>
          </div>
        </section>
      </main>

      {/* ================= FOOTER ================= */}
      <footer id="contact">
        <div className="footer-main">
          <div className="footer-brand">
            <a href="#home" className="footer-logo">
              SHNOOR<span>.</span>
            </a>

            <p>
              Customer relationship management for teams that want to
              work smarter and grow better.
            </p>
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
            <a href="#home">Home</a>
          </div>

          <div className="footer-column">
            <h4>ACCOUNT</h4>
            <a href="/login">Login</a>
            <a href="/signup">Create Account</a>
          </div>

          <div className="footer-column">
            <h4>CONTACT</h4>
            <a href="mailto:info@shnoor.com">
              info@shnoor.com
            </a>
            <span>United States</span>
          </div>
        </div>

        <div className="footer-bottom">
          <span>
            © 2026 SHNOOR International LLC. All rights reserved.
          </span>

          <div>
            <a href="#home">Privacy</a>
            <a href="#home">Terms</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;

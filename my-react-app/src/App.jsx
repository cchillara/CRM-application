import "./App.css";
import Login from "./auth/Login";
import Signup from "./auth/Signup";

function App() {
  const path = window.location.pathname;

  if (path === "/login") {
    return <Login />;
  }

  if (path === "/signup") {
    return <Signup />;
  }

  return (
    <>
      {/* Navbar */}
      <header className="navbar">
        <div className="logo">SHNOOR<span>.</span></div>

        <nav>
          <a href="#home">Home</a>
          <a href="#features">Features</a>
          <a href="#dashboard">Dashboard</a>
          <a href="#about">About</a>
          <a href="#contact">Contact</a>
        </nav>

        <a href="/login" className="login">Login</a>
      </header>

      {/* Hero */}
      <section className="hero" id="home">
        <div className="hero-content">
          <p className="small-title">CUSTOMER RELATIONSHIP MANAGEMENT</p>

          <h1>
            Manage your customers.
            <br />
            <span>Grow your business.</span>
          </h1>

          <p className="hero-description">
            SHNOOR CRM helps teams manage customers, leads, deals and
            business activities from one simple platform.
          </p>

          <div className="hero-info">
            <div>
              <strong>Customer Management</strong>
              <p>Keep all customer information in one place.</p>
            </div>

            <div>
              <strong>Sales Tracking</strong>
              <p>Follow leads and deals easily.</p>
            </div>
          </div>
        </div>

        {/* Simple CRM Preview */}
        <div className="crm-preview">
          <div className="crm-sidebar">
            <h3>SHNOOR<span>.</span></h3>

            <p className="active">Dashboard</p>
            <p>Customers</p>
            <p>Leads</p>
            <p>Deals</p>
            <p>Reports</p>
            <p>Settings</p>
          </div>

          <div className="crm-main">
            <div className="crm-header">
              <div>
                <small>Overview</small>
                <h2>Dashboard</h2>
              </div>

              <div className="search">Search</div>
            </div>

            <div className="numbers">
              <div>
                <small>Total Customers</small>
                <strong>1,248</strong>
              </div>

              <div>
                <small>New Leads</small>
                <strong>248</strong>
              </div>

              <div>
                <small>Active Deals</small>
                <strong>86</strong>
              </div>
            </div>

            <div className="chart-box">
              <h4>Customer Growth</h4>

              <div className="chart">
                <i></i>
                <i></i>
                <i></i>
                <i></i>
                <i></i>
                <i></i>
                <i></i>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="features" id="features">
        <div className="section-title">
          <p className="small-title">CRM FEATURES</p>

          <h2>Everything your team needs</h2>

          <p>
            Simple tools to organize customer information and manage
            your daily business activities.
          </p>
        </div>

        <div className="feature-list">
          <div className="feature">
            <span>01</span>
            <h3>Customer Management</h3>
            <p>
              Store customer details, contact information and
              communication history in one place.
            </p>
          </div>

          <div className="feature">
            <span>02</span>
            <h3>Lead Management</h3>
            <p>
              Track leads from the first contact until they become
              customers.
            </p>
          </div>

          <div className="feature">
            <span>03</span>
            <h3>Deal Management</h3>
            <p>
              Monitor sales opportunities and keep track of ongoing
              deals.
            </p>
          </div>

          <div className="feature">
            <span>04</span>
            <h3>Reports</h3>
            <p>
              View important business information through simple
              reports and dashboards.
            </p>
          </div>
        </div>
      </section>

      {/* Dashboard */}
      <section className="dashboard" id="dashboard">
        <div className="dashboard-text">
          <p className="small-title">DASHBOARD</p>

          <h2>A clear view of your business</h2>

          <p>
            The CRM dashboard gives your team a simple overview of
            customers, leads, deals and recent activities.
          </p>

          <ul>
            <li>Customer information in one place</li>
            <li>Lead and deal tracking</li>
            <li>Simple business reports</li>
            <li>Recent activity monitoring</li>
          </ul>
        </div>

        <div className="dashboard-card">
          <div className="dashboard-top">
            <h3>Business Overview</h3>
            <span>September 2026</span>
          </div>

          <div className="dashboard-stats">
            <div>
              <small>Customers</small>
              <strong>1,248</strong>
            </div>

            <div>
              <small>Leads</small>
              <strong>248</strong>
            </div>

            <div>
              <small>Deals</small>
              <strong>86</strong>
            </div>
          </div>

          <div className="activity">
            <h4>Recent Activity</h4>

            <p>
              New customer added
              <span>10 min ago</span>
            </p>

            <p>
              Lead converted
              <span>32 min ago</span>
            </p>

            <p>
              New deal created
              <span>1 hour ago</span>
            </p>
          </div>
        </div>
      </section>

      {/* About */}
      <section className="about" id="about">
        <div>
          <p className="small-title">ABOUT SHNOOR</p>
          <h2>Technology that helps businesses work better.</h2>
        </div>

        <p>
          SHNOOR CRM is designed to bring customer information,
          sales activities and business operations together in one
          organized workspace.
        </p>
      </section>

      {/* Footer */}
      <footer id="contact">
        <div>
          <h2>SHNOOR<span>.</span></h2>
          <p>Customer Relationship Management</p>
        </div>

        <div>
          <h4>CRM</h4>
          <a href="#features">Features</a>
          <a href="#dashboard">Dashboard</a>
        </div>

        <div>
          <h4>Company</h4>
          <a href="#about">About</a>
          <a href="#contact">Contact</a>
        </div>

        <div>
          <h4>Contact</h4>
          <p>info@shnoor.com</p>
          <p>United States</p>
        </div>

        <div className="copyright">
          © 2026 SHNOOR International LLC
        </div>
      </footer>
    </>
  );
}

export default App;

import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { PlatformProvider } from "./context/PlatformContext";
import "./styles.css";

const handoffToken = new URLSearchParams(window.location.hash.slice(1)).get("token");
if (handoffToken) {
  localStorage.setItem("shnoorSuperAdminToken", handoffToken);
  window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}`);
}

class DashboardErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error("Super Admin dashboard render failed:", error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <main role="alert" style={{ maxWidth: 720, margin: "12vh auto", padding: 32, fontFamily: "Arial, sans-serif", color: "#27323d" }}>
          <h1>Dashboard could not be displayed</h1>
          <p>{this.state.error.message || "An unexpected dashboard error occurred."}</p>
          <button type="button" onClick={() => window.location.reload()}>Reload dashboard</button>
          <a href={import.meta.env.VITE_LOGIN_URL || "http://localhost:5173/login"} style={{ marginLeft: 16 }}>Return to login</a>
        </main>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <DashboardErrorBoundary>
      <PlatformProvider>
        <App />
      </PlatformProvider>
    </DashboardErrorBoundary>
  </React.StrictMode>
);

import { Component } from "react";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error("User Portal render failed:", error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return <main className="portal-error" role="alert"><div className="portal-error-card">
        <span className="eyebrow">USER PORTAL</span>
        <h1>The dashboard could not load</h1>
        <p>{this.state.error.message || "An unexpected error occurred while rendering the portal."}</p>
        <button className="primary-button" onClick={() => window.location.reload()}>Reload portal</button>
      </div></main>;
    }
    return this.props.children;
  }
}

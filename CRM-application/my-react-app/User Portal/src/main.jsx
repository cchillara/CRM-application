import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import ErrorBoundary from "./components/ErrorBoundary.jsx";
import { PortalProvider } from "./context/PortalContext.jsx";
import "./styles.css";

createRoot(document.getElementById("root")).render(
  <React.StrictMode><ErrorBoundary><PortalProvider><App /></PortalProvider></ErrorBoundary></React.StrictMode>
);

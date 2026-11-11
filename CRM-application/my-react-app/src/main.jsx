import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import { BrowserRouter } from "react-router-dom";

const savedTheme = localStorage.getItem("crm-theme") || "white";
document.documentElement.setAttribute("data-theme", savedTheme);
document.body.className = `theme-${savedTheme}`;

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>
);

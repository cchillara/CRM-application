import { useLocation } from "react-router-dom";

const titles = {
  "/": ["Dashboard", "Platform overview"],
  "/organizations": ["Organizations", "Manage customer organizations"],
  "/users": ["Users", "Users across organizations"],
  "/subscriptions": ["Subscriptions", "Plans and billing"],
  "/analytics": ["Analytics", "Platform metrics"],
  "/audit-logs": ["Audit Logs", "Recent platform activity"],
  "/support": ["Support", "Customer support tickets"],
  "/settings": ["Settings", "Platform preferences"]
};

export default function Header() {
  const { pathname } = useLocation();
  const [title, subtitle] = titles[pathname] || titles["/"];

  return (
    <header className="header">
      <div>
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>

      <div className="header-role">SUPER ADMIN</div>
    </header>
  );
}

import { useLocation } from "react-router-dom";

const titles = {
  "/": ["Dashboard", "Platform overview"],
  "/organizations": ["Organizations", "Manage customer organizations"],
  "/subscriptions": ["Subscriptions", "Plans and active subscriptions"],
  "/analytics": ["Analytics", "Metrics calculated from current platform data"],
  "/audit-logs": ["Audit Logs", "Recent Super Admin activity"],
  "/support": ["Support & Help", "Review and reply to organization queries"],
  "/settings": ["Settings", "Platform configuration, profile and security"]
};

export default function Header() {
  const { pathname } = useLocation();
  const key = pathname.startsWith("/organizations/") ? "/organizations" : pathname;
  const [title, subtitle] = titles[key] || titles["/"];

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

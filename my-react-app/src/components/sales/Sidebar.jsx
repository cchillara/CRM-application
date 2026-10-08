/* Edited by subham sharma on 06-10-2026*/
import { useState } from "react";
import { LayoutDashboard,  Users,UserRound,CheckSquare,Calendar, NotebookPen, Package, FileText, BarChart3,
    Bell, CircleUserRound
} from "lucide-react";
import { NavLink } from "react-router-dom";
import "./Sidebar.css";
const navigationItems = [
{label:"Dashboard", icon:LayoutDashboard , path:"/dashboard"},
{label:"Leads", icon: Users , path:"/leads"},
{label:"Customers", icon:UserRound , path:"/customers"},
{label:"Tasks", icon:CheckSquare , path:"/tasks"},
{label:"Calendar", icon:Calendar , path:"/calendar"},
{label:"Notes", icon:NotebookPen , path:"/notes"},
{label:"Products", icon:Package , path:"/products"},
{label:"Ouotes", icon:FileText , path:"/quotes"},
{label:"Analytics", icon:BarChart3 , path:"/analytics"},
{label:"Notifications", icon:Bell , path:"/notifications"},
{label:"Profile", icon:CircleUserRound , path:"/profile"}
]

 
function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside className={`sales-sidebar ${collapsed ? "collapsed" : ""}`}>
      <div className="sales-sidebar-header">
        <div className="sales-brand">
          <span>SHNOOR</span>
          <span className="sales-brand-dot">.</span>
        </div>

        <button
          type="button"
          className="sidebar-collapse-button"
          onClick={() => setCollapsed((value) => !value)}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? "→" : "←"}
        </button>
      </div>

      <nav className="sales-navigation">
        {navigationItems.map((item) => (
          <NavLink
            key={item.label}
            to={item.path}
            className={({ isActive }) =>
              `sales-navigation-item ${isActive ? "active" : ""}`
            }
          >
            <span className="sales-navigation-icon">
              <item.icon size={20} strokeWidth={1.8} />
            </span>

            {!collapsed && (
              <>
                <span className="sales-navigation-label">
                  {item.label}
                </span>

                {item.badge && (
                  <span className="sales-navigation-badge">
                    {item.badge}
                  </span>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}

export default Sidebar;

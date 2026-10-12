import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Handshake,
  CheckSquare,
  UserCheck,
  Package,
  UserCog,
  Settings,
  LogOut
} from 'lucide-react';
import { menuItems } from '../data';

const iconMap = {
  LayoutDashboard: LayoutDashboard,
  Users: Users,
  Handshake: Handshake,
  CheckSquare: CheckSquare,
  UserCheck: UserCheck,
  Package: Package,
  UserCog: UserCog,
  Settings: Settings
};

export default function Sidebar() {
  return (
    <aside className="crm-sidebar" aria-label="Main Navigation">
      {/* Brand / Logo Header */}
      <div className="crm-brand-header">
        <div className="crm-brand-logo">
          <span>S</span>
        </div>
        <div className="crm-brand-details">
          <h2 className="crm-brand-name">SHNOOR</h2>
          <span className="crm-brand-role">Client Admin</span>
        </div>
      </div>

      <nav className="crm-nav-container">
        <ul className="crm-nav-list">
          {menuItems.map((item) => {
            const IconComponent = iconMap[item.icon] || LayoutDashboard;
            const targetPath = item.id === 'dashboard' ? '/client-admin' : `/client-admin/${item.id}`;

            return (
              <li key={item.id} className="crm-nav-item">
                <NavLink
                  to={targetPath}
                  end={item.id === 'dashboard'}
                  className={({ isActive }) => `crm-nav-btn ${isActive ? 'active' : ''}`}
                >
                  <span className="crm-nav-icon-wrapper">
                    <IconComponent size={19} strokeWidth={2} />
                  </span>
                  <span className="crm-nav-label">{item.label}</span>
                  {item.badge && (
                    <span className="crm-nav-badge">
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="crm-sidebar-footer">
        <div className="crm-user-profile">
          <div className="crm-user-avatar">
            <span>CA</span>
          </div>
          <div className="crm-user-info">
            <span className="crm-user-name">Client Admin</span>
            <span className="crm-user-email">admin@crmclient.com</span>
          </div>
        </div>
        <button
          type="button"
          className="crm-logout-btn"
          title="Sign out"
          onClick={() => alert('Logout clicked')}
        >
          <LogOut size={16} />
        </button>
      </div>
    </aside>
  );
}

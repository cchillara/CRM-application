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
  LogOut,
  X
} from 'lucide-react';
import { menuItems } from '../data';
import { useNavigate } from 'react-router-dom';
import { getProfile } from '../Api/Profile';

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

export default function Sidebar({ isOpen = false, onClose }) {
  const navigate = useNavigate();
  const [userProfile, setUserProfile] = React.useState({
    name: 'Client Admin',
    email: 'admin@crmclient.com'
  });

  React.useEffect(() => {
    let isMounted = true;
    getProfile()
      .then((data) => {
        if (data && isMounted) {
          setUserProfile({
            name: data.name || 'Client Admin',
            email: data.email || 'admin@crmclient.com'
          });
        }
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, []);

  const initials = (userProfile.name || 'Client Admin')
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'CA';

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('firebaseToken');
    if (window.auth && typeof window.auth.signOut === 'function') {
      window.auth.signOut();
    }
    navigate('/login');
  };

  return (
    <aside className={`crm-sidebar ${isOpen ? 'open' : ''}`} aria-label="Main Navigation">
      <div className="crm-brand-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div className="crm-brand-logo">
            <span>S</span>
          </div>
          <div className="crm-brand-details">
            <h2 className="crm-brand-name">SHNOOR</h2>
            <span className="crm-brand-role">Client Admin</span>
          </div>
        </div>

        {onClose && (
          <button
            type="button"
            className="crm-sidebar-close-btn"
            onClick={onClose}
            aria-label="Close navigation"
            title="Close menu"
          >
            <X size={18} />
          </button>
        )}
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
                  onClick={() => onClose && onClose()}
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

      {/* <div className="crm-sidebar-footer">
        <div
          className="crm-user-profile"
          onClick={() => navigate('/client-admin/profile')}
          style={{ cursor: 'pointer' }}
          title="View Profile"
        >
          <div className="crm-user-avatar">
            <span>{initials}</span>
          </div>
          <div className="crm-user-info">
            <span className="crm-user-name">{userProfile.name}</span>
            <span className="crm-user-email">{userProfile.email}</span>
          </div>
        </div>
        <button
          type="button"
          className="crm-logout-btn"
          title="Sign out"
          onClick={() => handleLogout()}
        >
          <LogOut size={16} />
        </button>
      </div> */}
    </aside>
  );
}
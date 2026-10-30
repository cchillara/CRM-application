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
  X,
  ArrowRight,
  ArrowLeft
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

export default function Sidebar({ isOpen = false, onToggle, onClose }) {
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
    <aside className={`crm-sidebar ${isOpen ? 'open' : 'collapsed'}`} aria-label="Main Navigation">
      <div className={`crm-brand-header ${!isOpen ? 'collapsed' : ''}`}>
        {isOpen ? (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
              <div className="crm-brand-logo">
                <span>S</span>
              </div>
              <div className="crm-brand-details">
                <h2 className="crm-brand-name">SHNOOR</h2>
                <span className="crm-brand-role">Client Admin</span>
              </div>
            </div>

            {onToggle && (
              <button
                type="button"
                className="crm-sidebar-toggle-btn"
                onClick={onToggle}
                aria-label="Collapse navigation"
                title="Collapse sidebar"
              >
                <ArrowLeft size={18} />
              </button>
            )}
          </>
        ) : (
          <button
            type="button"
            className="crm-sidebar-collapsed-toggle-btn"
            onClick={onToggle}
            aria-label="Expand navigation"
            title="Expand sidebar"
          >
            <ArrowRight size={18} />
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
                  onClick={() => {
                    if (typeof window !== 'undefined' && window.innerWidth <= 768 && onClose) {
                      onClose();
                    }
                  }}
                  className={({ isActive }) => `crm-nav-btn ${isActive ? 'active' : ''}`}
                  title={item.label}
                >
                  <span className="crm-nav-icon-wrapper">
                    <IconComponent size={20} strokeWidth={2} />
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
    </aside>
  );
}
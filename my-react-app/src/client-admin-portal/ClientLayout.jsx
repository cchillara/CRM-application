import React, { useState, useEffect, useRef } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import Sidebar from './pages/Sidebar';
import { Menu, LogOut, User } from 'lucide-react';
import ToggleTheme from './components/ThemeToggle';

export default function ClientLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const sidebarRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const savedTheme = localStorage.getItem("crm-theme");
    if (savedTheme) {
      document.documentElement.setAttribute("data-theme", savedTheme);
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth <= 768) {
      setSidebarOpen(false);
    }
  }, [location.pathname]);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (
        typeof window !== 'undefined' &&
        window.innerWidth <= 768 &&
        sidebarOpen &&
        sidebarRef.current &&
        !sidebarRef.current.contains(e.target) &&
        !e.target.closest('.crm-hamburger-btn')
      ) {
        setSidebarOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [sidebarOpen]);

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape' && window.innerWidth <= 768) setSidebarOpen(false);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('firebaseToken');
    if (window.auth && typeof window.auth.signOut === 'function') {
      window.auth.signOut();
    }
    navigate('/login');
  };

  return (
    <div className={`crm-portal-container ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
      <header className="crm-top-header-bar">
        <div className="crm-top-header-left">
        </div>

        <div className="crm-top-header-actions">

          <button
            type="button"
            className='crm-header-icon-btn'
            title='Profile'
            onClick={() => navigate('/client-admin/profile')}
          >
            <User size={18} />
          </button>
          <button
            type="button"
            className="crm-header-logout-btn"
            onClick={handleLogout}
            title="Log out"
          >
            <LogOut size={16} />
            <span>Log out</span>
          </button>
        </div>
      </header>
      {sidebarOpen && (
        <div
          className="crm-sidebar-backdrop"
          aria-hidden="true"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div ref={sidebarRef}>
        <Sidebar
          isOpen={sidebarOpen}
          onToggle={() => setSidebarOpen((prev) => !prev)}
          onClose={() => setSidebarOpen(false)}
        />
      </div>

      <main className="crm-main-viewport">
        <Outlet />
      </main>
    </div>
  );
}

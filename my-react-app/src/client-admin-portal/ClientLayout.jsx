import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './pages/Sidebar';

export default function ClientLayout() {
  return (
    <div className="crm-portal-container">
      <Sidebar />
      <main className="crm-main-viewport">
        <Outlet />
      </main>
    </div>
  );
}

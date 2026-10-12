import React, { useState, useEffect } from 'react';
import {
  Users,
  UserCheck,
  CreditCard,
  DollarSign,
  LogOut,
  ArrowUpRight,
  TrendingUp,
  RefreshCw
} from 'lucide-react';
import {
  leadsByStatus as fallbackStatusBars,
  recentLeads, deals, qualifiedLeads, openDeals, dealsByStage,
} from '../data';
import { getStored } from '../storage';
import { getDashboard } from './../Api/Dashboard';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const navigate = useNavigate();

  // Load from local stored cache for instant rendering without flash
  const storedLeads = getStored('leads', recentLeads);
  const storedDeals = getStored('deals', deals);

  const [stats, setStats] = useState(() => ({
    totalLeads: storedLeads.length,
    qualifiedLeads: storedLeads.filter(l => (l.status || '').toLowerCase() === 'qualified' || (l.status || '').toLowerCase() === 'active').length,
    openDeals: storedDeals.filter(d => !['Won', 'Lost', 'WON', 'LOST'].includes(d.stage)).length,
    totalRevenue: storedDeals
      .filter(d => d.stage === 'Won' || d.stage === 'WON')
      .reduce((sum, d) => sum + (Number(d.value) || 0), 0)
  }));

  const [leadList, setLeadList] = useState(() => (storedLeads.length > 0 ? storedLeads.slice(0, 6) : recentLeads));
  const [statusBars, setStatusBars] = useState(() => fallbackStatusBars);
  const [loading, setLoading] = useState(false);

  // Fetch real database data on mount
  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const data = await getDashboard();
      if (data) {
        setStats({
          totalLeads: data.totalLeads ?? 0,
          qualifiedLeads: data.qualifiedLeads ?? 0,
          openDeals: data.openDeals ?? 0,
          totalRevenue: data.totalRevenue ?? 0,
        });

        if (Array.isArray(data.recentLeads)) {
          setLeadList(data.recentLeads);
        }

        if (Array.isArray(data.leadsByStatus) && data.leadsByStatus.length > 0) {
          setStatusBars(data.leadsByStatus);
        }
      }
    } catch (err) {
      console.warn('[Dashboard] API unavailable, using local data:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
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
    <div className="crm-dashboard">

      <section className="crm-banner-card" aria-label="Platform Status">
        <div className="crm-banner-left">
          <h2 className="crm-banner-title">Platform Overview</h2>
          <span className="crm-banner-subtitle">SHNOOR CRM · Client Admin</span>
        </div>
        <div className="crm-banner-right" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button
            type="button"
            className="crm-banner-btn"
            onClick={fetchDashboardData}
            title="Refresh database metrics"
            disabled={loading}
          >
            <RefreshCw size={14} className={loading ? 'crm-spin' : ''} />
            <span>{loading ? 'Refreshing...' : 'Refresh'}</span>
          </button>
          <button
            type="button"
            className="crm-banner-btn"
            onClick={handleLogout}
          >
            <LogOut size={15} />
            <span>Log out</span>
          </button>
        </div>
      </section>

      {/* KPI Cards Grid */}
      <section className="crm-kpi-grid" aria-label="Key Performance Indicators">
        {/* Card 1: Total Leads */}
        <div 
          className="crm-kpi-card border-blue" 
          onClick={() => navigate('/client-admin/leads')}
          style={{ cursor: 'pointer' }}
          title="Click to view all leads"
        >
          <div className="crm-kpi-header">
            <span className="crm-kpi-title">Total Leads</span>
            <span className="crm-kpi-icon-pill icon-blue">
              <Users size={18} />
            </span>
          </div>
          <div className="crm-kpi-body">
            <span className="crm-kpi-value">{stats.totalLeads}</span>
          </div>
        </div>

        {/* Card 2: Qualified Leads */}
        <div 
          className="crm-kpi-card border-green" 
          onClick={() => navigate('/client-admin/leads')}
          style={{ cursor: 'pointer' }}
          title="Click to view qualified leads"
        >
          <div className="crm-kpi-header">
            <span className="crm-kpi-title">Qualified Leads</span>
            <span className="crm-kpi-icon-pill icon-green">
              <UserCheck size={18} />
            </span>
          </div>
          <div className="crm-kpi-body">
            <span className="crm-kpi-value">{stats.qualifiedLeads}</span>
          </div>
        </div>

        {/* Card 3: Open Deals */}
        <div 
          className="crm-kpi-card border-orange" 
          onClick={() => navigate('/client-admin/deals')}
          style={{ cursor: 'pointer' }}
          title="Click to view open deals"
        >
          <div className="crm-kpi-header">
            <span className="crm-kpi-title">Open Deals</span>
            <span className="crm-kpi-icon-pill icon-orange">
              <CreditCard size={18} />
            </span>
          </div>
          <div className="crm-kpi-body">
            <span className="crm-kpi-value">{stats.openDeals}</span>
          </div>
        </div>

        {/* Card 4: Total Revenue */}
        <div 
          className="crm-kpi-card border-red" 
          onClick={() => navigate('/client-admin/deals')}
          style={{ cursor: 'pointer' }}
          title="Click to view won revenue"
        >
          <div className="crm-kpi-header">
            <span className="crm-kpi-title">Total Revenue</span>
            <span className="crm-kpi-icon-pill icon-red">
              <DollarSign size={18} />
            </span>
          </div>
          <div className="crm-kpi-body">
            <span className="crm-kpi-value">
              ${Number(stats.totalRevenue).toLocaleString()}
            </span>
          </div>
        </div>
      </section>

      <section className="crm-main-grid">
        {/* Left Card: Recent Leads */}
        <div className="crm-card crm-recent-leads-card">
          <div className="crm-card-header">
            <div>
              <h3 className="crm-card-title">Recent Leads</h3>
              <p className="crm-card-subtitle">Latest customer organizations & qualified leads from database</p>
            </div>
            <button
              type="button"
              className="crm-text-link-btn"
              onClick={() => navigate('/client-admin/leads')}
            >
              <span>View all</span>
              <ArrowUpRight size={14} />
            </button>
          </div>

          <div className="crm-lead-list">
            {leadList.length === 0 ? (
              <div style={{ padding: '24px 0', textAlign: 'center', color: '#64748b' }}>
                <p style={{ margin: 0, fontSize: '13.5px' }}>No leads created yet in database.</p>
                <button
                  type="button"
                  className="crm-banner-btn crm-btn-primary"
                  style={{ marginTop: '12px' }}
                  onClick={() => navigate('/client-admin/leads')}
                >
                  Create New Lead
                </button>
              </div>
            ) : (
              leadList.map((lead) => (
                <div key={lead.id} className="crm-lead-row">
                  <div className="crm-lead-info-group">
                    <div className="crm-avatar-pill">
                      {lead.avatarInitials || (lead.name ? lead.name.slice(0, 2).toUpperCase() : 'LE')}
                    </div>
                    <div className="crm-lead-text">
                      <span className="crm-lead-name">{lead.name || lead.title}</span>
                      <span className="crm-lead-contact">
                        {lead.contact}
                      </span>
                    </div>
                  </div>
                  <div className="crm-lead-meta">
                    <span className="crm-lead-value">
                      {typeof lead.value === 'number'
                        ? `$${lead.value.toLocaleString()}`
                        : (String(lead.value || '').startsWith('$') || String(lead.value || '').startsWith('₹')
                          ? lead.value
                          : `$${Number(lead.value || 0).toLocaleString()}`)}
                    </span>
                    <span className={`crm-status-badge badge-${(lead.statusType || lead.status || 'active').toLowerCase()}`}>
                      {lead.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column: Leads by Status */}
        <div className="crm-right-column">
          <div className="crm-card crm-status-card">
            <div className="crm-card-header">
              <div>
                <h3 className="crm-card-title">Leads by Status</h3>
                <p className="crm-card-subtitle">Pipeline progression & conversion distribution</p>
              </div>
            </div>

            <div className="crm-status-bars-container">
              {statusBars.map((item) => (
                <div key={item.label} className="crm-status-bar-row">
                  <div className="crm-status-bar-label-group">
                    <span className="crm-status-indicator" style={{ backgroundColor: item.color }} />
                    <span className="crm-status-bar-name">{item.label}</span>
                    <span className="crm-status-bar-count">{item.count} leads</span>
                  </div>
                  <div className="crm-progress-track">
                    <div
                      className="crm-progress-fill"
                      style={{
                        width: `${item.percentage}%`,
                        backgroundColor: item.color
                      }}
                    />
                  </div>
                  <span className="crm-status-bar-pct">{item.percentage}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </section>
    </div>
  );
}

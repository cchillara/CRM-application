import React, { useState, useEffect } from 'react';
import {
  Users,
  UserCheck,
  CreditCard,
  DollarSign,
  LogOut,
  ArrowUpRight,
  Calendar,
  AlertTriangle,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import {
  leadsByStatus as fallbackStatusBars,
  recentLeads, deals,
} from '../data';
import { getStored } from '../storage';
import { getDashboard } from './../Api/Dashboard';
import { getTasks } from './../Api/Tasks';
import { useNavigate } from 'react-router-dom';
import ToggleTheme from '../components/ThemeToggle';

const OWNER_NAMES = ['Sarah Jenkins', 'David Miller', 'Arjun Kumar', 'Elena Rostova', 'Marcus Vance', 'Meena Patel', 'Vikram Singh'];

function resolveOwnerName(raw, fallbackSeed = 0) {
  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (trimmed && trimmed !== 'Client Admin' && trimmed !== '—' && trimmed !== 'Unknown') {
      return trimmed;
    }
  } else if (raw && typeof raw === 'object') {
    const full = `${raw.firstName || ''} ${raw.lastName || ''}`.trim();
    if (full && full !== 'Client Admin') return full;
  }
  const idx = typeof fallbackSeed === 'number'
    ? Math.abs(fallbackSeed) % OWNER_NAMES.length
    : Math.abs(String(fallbackSeed).split('').reduce((sum, c) => sum + c.charCodeAt(0), 0)) % OWNER_NAMES.length;
  return OWNER_NAMES[idx];
}

function formatToMonthDateYear(dateInput) {
  if (!dateInput) return '';
  const str = String(dateInput).trim();
  if (/^\d{2}-\d{2}-\d{4}$/.test(str)) return str;
  const ymdMatch = str.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (ymdMatch) {
    const [, y, m, d] = ymdMatch;
    return `${m.padStart(2, '0')}-${d.padStart(2, '0')}-${y}`;
  }
  const d = new Date(str);
  if (!isNaN(d.getTime())) {
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const year = d.getFullYear();
    return `${month}-${day}-${year}`;
  }
  return str;
}

export default function Dashboard() {
  const navigate = useNavigate();

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
  const [overdueTasks, setOverdueTasks] = useState([]);
  const [isOverdueOpen, setIsOverdueOpen] = useState(false);


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
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const parseDate = (raw) => {
      if (!raw || raw === 'Upcoming') return null;
      if (/^\d{4}-\d{2}-\d{2}/.test(raw)) {
        const d = new Date(raw);
        return isNaN(d.getTime()) ? null : d;
      }

      const mdyDash = raw.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
      if (mdyDash) {
        const d = new Date(Number(mdyDash[3]), Number(mdyDash[1]) - 1, Number(mdyDash[2]));
        return isNaN(d.getTime()) ? null : d;
      }

      const mdySlash = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
      if (mdySlash) {
        const d = new Date(Number(mdySlash[3]), Number(mdySlash[1]) - 1, Number(mdySlash[2]));
        return isNaN(d.getTime()) ? null : d;
      }

      const d = new Date(raw);
      return isNaN(d.getTime()) ? null : d;
    };

    getTasks()
      .then((data) => {
        if (!Array.isArray(data)) return;
        const overdue = data
          .filter((t) => {
            if (t.completed === true || t.status === 'COMPLETED') return false;
            const d = parseDate(t.dueDate) || parseDate(t.due);
            if (!d) return false;
            d.setHours(0, 0, 0, 0);
            return d < todayStart;
          })
          .map((t, idx) => {
            const d = parseDate(t.dueDate) || parseDate(t.due);
            d.setHours(0, 0, 0, 0);
            const daysLate = Math.max(1, Math.floor((todayStart - d) / (1000 * 60 * 60 * 24)));
            const rawDue = t.due || (t.dueDate ? t.dueDate.split('T')[0] : '');
            return {
              ...t,
              daysLate,
              due: formatToMonthDateYear(rawDue),
              assignedTo: resolveOwnerName(t.assignedTo, t.title || idx)
            };
          })
          .sort((a, b) => b.daysLate - a.daysLate);
        setOverdueTasks(overdue);
      })
      .catch(() => { });
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

        <div className="crm-banner-right" style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
          <ToggleTheme />
          <button type="button" className="crm-banner-btn"
            onClick={() => navigate('/client-admin/calendar')}>
            <Calendar/>
          </button>

          {/* <button
            type="button"
            className="crm-banner-btn"
            onClick={handleLogout}
          >
            <LogOut size={15} />
            <span>Log out</span>
          </button> */}


        </div>
      </section>

      <section className="crm-overdue-widget">
        <div
          className="crm-overdue-widget-header crm-overdue-header-clickable"
          onClick={() => overdueTasks.length > 0 && setIsOverdueOpen(!isOverdueOpen)}
        >
          <div className="crm-overdue-widget-title-group">
            <AlertTriangle size={16} className="crm-overdue-widget-icon" />
            <span className="crm-overdue-widget-label">Overdue Alerts</span>
            {overdueTasks.length > 0 ? (
              <span className="crm-overdue-count-pill">{overdueTasks.length} Overdue</span>
            ) : (
              <span className="crm-overdue-clear-pill">0 Overdue</span>
            )}
          </div>
          {overdueTasks.length > 0 && (
            <button
              type="button"
              className="crm-overdue-toggle-btn"
              onClick={(e) => {
                e.stopPropagation();
                setIsOverdueOpen(!isOverdueOpen);
              }}
              aria-expanded={isOverdueOpen}
            >
              <span>{isOverdueOpen ? 'Hide Alerts' : 'View Alerts'}</span>
              {isOverdueOpen ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
            </button>
          )}
        </div>

        {overdueTasks.length === 0 ? (
          <div className="crm-overdue-widget-clear">
            ✅ No overdue tasks right now.
          </div>
        ) : (
          <>
            {!isOverdueOpen ? (
              <div
                className="crm-overdue-collapsed-preview"
                onClick={() => {
                  setIsOverdueOpen(true);

                }}
              >
                <p className="crm-overdue-widget-msg">
                  🚨 <strong>{overdueTasks[0].title}</strong> is {overdueTasks[0].daysLate} day{overdueTasks[0].daysLate > 1 ? 's' : ''} past its deadline.
                  {overdueTasks.length > 1 && (
                    <span className="crm-overdue-more-text"> +{overdueTasks.length - 1} more overdue alert{overdueTasks.length > 2 ? 's' : ''}</span>
                  )}
                </p>
                <div className="crm-overdue-widget-meta">
                  <span>Due: <strong>{overdueTasks[0].due}</strong></span>
                  <span>Assigned: <strong>{typeof overdueTasks[0].assignedTo === 'string' ? overdueTasks[0].assignedTo : (overdueTasks[0].assignedTo?.firstName || '—')}</strong></span>
                  <span>Org: <strong>{overdueTasks[0].client || '—'}</strong></span>
                </div>
              </div>
            ) : (
              <div className="crm-overdue-dropdown-list" onClick={() => navigate("/client-admin/tasks")}>
                {overdueTasks.map((task) => (
                  <div key={task.id} className="crm-overdue-widget-body">
                    <p className="crm-overdue-widget-msg">
                      🚨 <strong>{task.title}</strong> is {task.daysLate} day{task.daysLate > 1 ? 's' : ''} past its deadline.
                    </p>
                    <div className="crm-overdue-widget-meta">
                      <span>Due: <strong>{task.due}</strong></span>
                      <span>Assigned: <strong>{typeof task.assignedTo === 'string' ? task.assignedTo : (task.assignedTo?.firstName || '—')}</strong></span>
                      <span>Org: <strong>{task.client || '—'}</strong></span>
                      {task.priority && <span>Priority: <strong>{task.priority}</strong></span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </section>

      <section className="crm-kpi-grid-dashboard" aria-label="Key Performance Indicators">

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

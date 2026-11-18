import { useEffect, useState } from "react";
import { BriefcaseBusiness, CalendarDays, Check, CheckCheck, Clock3, DollarSign, Handshake, TrendingUp, UserRound, Users } from "lucide-react";
import { getDeals, getLeads, getTasks, updateTask } from "../api/userPortalApi.js";
import { usePortal } from "../context/PortalContext.jsx";
import { ActivityRow, PanelHeading, StatCard } from "../components/DashboardWidgets.jsx";

const unwrap = (value) => Array.isArray(value) ? value : value?.items || [];
const money = (amount) => new Intl.NumberFormat(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(Number(amount) || 0);
const taskDate = (value) => value ? new Date(value).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : "No due date";

export default function Dashboard({ onNavigate }) {
  const { account, notifications } = usePortal();
  const [data, setData] = useState({ leads: [], deals: [], tasks: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    Promise.all([getLeads(), getDeals(), getTasks()]).then(([leads, deals, tasks]) => {
      if (active) {
        const rows = [unwrap(leads), unwrap(deals), unwrap(tasks)];
        setData({ leads: rows[0], deals: rows[1], tasks: rows[2] });
      }
    }).catch((requestError) => { if (active) { setData({ leads: [], deals: [], tasks: [] }); setError(requestError.message || "Could not load your CRM data."); } })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);
  const { leads, deals, tasks } = data;
  const openDeals = deals.filter((deal) => !["Won", "Lost"].includes(deal.stage));
  const wonRevenue = deals.filter((deal) => deal.stage === "Won").reduce((sum, deal) => sum + Number(deal.value || 0), 0);
  const pendingTasks = tasks.filter((task) => task.status !== "COMPLETED" && !task.completed).slice(0, 4);
  const recentLeads = [...leads].slice(0, 4);
  const firstName = account.name?.trim().split(/\s+/)[0] || "there";
  async function toggleTask(task) {
    const done = !(task.status === "COMPLETED" || task.completed);
    setData((current) => ({ ...current, tasks: current.tasks.map((item) => item.id === task.id ? { ...item, status: done ? "COMPLETED" : "TODO", completed: done } : item) }));
    try { await updateTask(task.id, { completed: done, status: done ? "COMPLETED" : "TODO" }); }
    catch (requestError) {
      setData((current) => ({ ...current, tasks: current.tasks.map((item) => item.id === task.id ? { ...item, status: done ? "TODO" : "COMPLETED", completed: !done } : item) }));
      setError(requestError.message || "Could not update this task.");
    }
  }

  return <>
    {error && <div className="workspace-feedback" role="status">{error}<button type="button" onClick={() => setError("")}>Dismiss</button></div>}
    <section className="welcome-card"><div><span className="eyebrow">{new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" }).toUpperCase()}</span><h2>Welcome back, {firstName}</h2><p>Here’s what’s happening with your work today.</p></div></section>
    <section className="stats-grid" aria-label="Performance overview">
      <StatCard title="My Leads" value={loading ? "—" : leads.length} icon={Users} tone="blue" note="Assigned to you" />
      <StatCard title="Qualified Leads" value={loading ? "—" : leads.filter((lead) => lead.status === "Qualified").length} icon={UserRound} tone="green" note="Ready to progress" />
      <StatCard title="Open Deals" value={loading ? "—" : openDeals.length} icon={BriefcaseBusiness} tone="orange" note="Active opportunities" />
      <StatCard title="Won Revenue" value={loading ? "—" : money(wonRevenue)} icon={DollarSign} tone="purple" note="Closed won deals" />
    </section>
    <section className="dashboard-grid">
      <article className="panel leads-panel"><PanelHeading title="My recent leads" detail="Your latest assigned opportunities" action="View all" onAction={() => onNavigate("My Leads")} /><div className="lead-list">{recentLeads.map((lead, index) => { const name = lead.name || lead.company || "Lead"; return <div className="lead-row" key={lead.id}><div className={`avatar avatar-${["blue", "purple", "green", "orange"][index % 4]}`}>{name.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase()}</div><div className="lead-copy"><strong>{name}</strong><span>{lead.contactName || lead.email || lead.source || "Assigned lead"}</span></div><span className={`status status-${String(lead.status || "new").toLowerCase()}`}>{lead.status || "New"}</span></div>; })}{!loading && recentLeads.length === 0 && <p className="empty-state">No leads are assigned to you yet.</p>}</div></article>
      <article className="panel pipeline-panel"><PanelHeading title="Lead pipeline" detail="Your leads by stage" action="Reports" onAction={() => onNavigate("Reports")} /><div className="pipeline-total"><strong>{loading ? "—" : leads.length}</strong><span>assigned leads</span><span className="growth"><TrendingUp size={15} /> {leads.filter((lead) => lead.status === "Qualified").length} qualified</span></div>{["New", "Contacted", "Qualified", "Proposal"].map((stage, index) => { const count = leads.filter((lead) => lead.status === stage).length; const max = Math.max(1, ...["New", "Contacted", "Qualified", "Proposal"].map((name) => leads.filter((lead) => lead.status === name).length)); return <div className="pipeline-row" key={stage}><div className="pipeline-label"><span>{stage}</span><strong>{count}</strong></div><div className="bar-track"><div style={{ width: `${count / max * 100}%`, background: ["#60a5fa", "#8b7cf6", "#10b981", "#f59e0b"][index] }} /></div></div>; })}</article>
      <article className="panel tasks-panel"><PanelHeading title="My tasks" detail="Stay on top of your follow-ups" action="View tasks" onAction={() => onNavigate("Tasks")} /><div className="task-list">{pendingTasks.map((task) => <button type="button" className="task-row" key={task.id} onClick={() => toggleTask(task)}><span className="task-check"><Check size={13} /></span><span className="task-copy"><strong>{task.title}</strong><span><Clock3 size={13} /> {taskDate(task.due || task.dueDate)}</span></span><span className={`priority priority-${String(task.priority || "Medium").toLowerCase()}`}>{task.priority || "Medium"}</span></button>)}{!loading && pendingTasks.length === 0 && <p className="empty-state">You’re all caught up on tasks.</p>}</div></article>
      <article className="panel activity-panel"><PanelHeading title="Recent activity" detail="Updates across your workspace" action="See notifications" onAction={() => onNavigate("Notifications")} /><div className="activity-list">{notifications.slice(0, 4).map((notice) => <ActivityRow key={notice.id} icon={notice.iconName === "deal" ? Handshake : notice.iconName === "calendar" ? CalendarDays : CheckCheck} tone={notice.tone || "blue"} title={notice.title} detail={notice.detail} time={notice.time} />)}{notifications.length === 0 && <p className="empty-state">New CRM updates will appear here.</p>}</div></article>
    </section>
  </>;
}

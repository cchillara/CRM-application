import { useState } from "react";
import {
  Bell, BriefcaseBusiness, CalendarDays, Check, CheckCheck, CheckSquare,
  Clock3, DollarSign, Handshake, TrendingUp, UserRound, Users
} from "lucide-react";
import { ActivityRow, PanelHeading, StatCard } from "../components/DashboardWidgets";

const leads = [
  { initials: "AC", name: "Acme Corporation", contact: "Olivia Chen · olivia@acme.com", status: "Qualified", value: "$24,500", color: "blue" },
  { initials: "NW", name: "Northwind Traders", contact: "James Wilson · james@northwind.io", status: "Contacted", value: "$18,200", color: "purple" },
  { initials: "GS", name: "Globex Solutions", contact: "Priya Shah · priya@globex.com", status: "New", value: "$12,800", color: "green" },
  { initials: "SC", name: "Stark Consulting", contact: "Noah Kim · noah@stark.co", status: "Proposal", value: "$31,000", color: "orange" }
];

const tasks = [
  { title: "Send revised proposal to Acme Corp.", due: "Today, 11:30 AM", priority: "High", done: false },
  { title: "Follow up with James Wilson", due: "Today, 2:00 PM", priority: "Medium", done: false },
  { title: "Prepare discovery call notes", due: "Tomorrow, 9:00 AM", priority: "Low", done: true }
];

export default function Dashboard({ onNavigate }) {
  const [doneTasks, setDoneTasks] = useState(tasks.map((task) => task.done));
  const bars = [["New", 18, "#60a5fa"], ["Contacted", 13, "#8b7cf6"], ["Qualified", 9, "#10b981"], ["Proposal", 6, "#f59e0b"]];

  return <>
    <section className="welcome-card"><div><span className="eyebrow">WEDNESDAY, NOVEMBER 5, 2026</span><h2>Good morning, Alex <span>👋</span></h2><p>Here’s what’s happening with your work today.</p></div></section>
    <section className="stats-grid" aria-label="Performance overview">
      <StatCard title="My Leads" value="46" delta="12%" icon={Users} tone="blue" note="vs. last month" />
      <StatCard title="Qualified Leads" value="18" delta="8%" icon={UserRound} tone="green" note="vs. last month" />
      <StatCard title="Open Deals" value="12" delta="3%" icon={BriefcaseBusiness} tone="orange" note="vs. last month" />
      <StatCard title="Won Revenue" value="$84,250" delta="16%" icon={DollarSign} tone="purple" note="vs. last month" />
    </section>
    <section className="dashboard-grid">
      <article className="panel leads-panel"><PanelHeading title="My recent leads" detail="Your latest customer opportunities" action="View all" onAction={() => onNavigate("My Leads")} /><div className="lead-list">{leads.map((lead) => <div className="lead-row" key={lead.name}><div className={`avatar avatar-${lead.color}`}>{lead.initials}</div><div className="lead-copy"><strong>{lead.name}</strong><span>{lead.contact}</span></div><span className={`status status-${lead.status.toLowerCase()}`}>{lead.status}</span><strong className="lead-value">{lead.value}</strong></div>)}</div></article>
      <article className="panel pipeline-panel"><PanelHeading title="Lead pipeline" detail="Your leads by stage" action="Reports" onAction={() => onNavigate("Reports")} /><div className="pipeline-total"><strong>46</strong><span>total active leads</span><span className="growth"><TrendingUp size={15} /> 12.4%</span></div><div className="pipeline-bars">{bars.map(([label, count, color]) => <div className="pipeline-row" key={label}><div className="pipeline-label"><span>{label}</span><strong>{count}</strong></div><div className="bar-track"><div style={{ width: `${count / 18 * 100}%`, background: color }} /></div></div>)}</div></article>
      <article className="panel tasks-panel"><PanelHeading title="My tasks" detail="Stay on top of your follow-ups" action="View tasks" onAction={() => onNavigate("Tasks")} /><div className="task-list">{tasks.map((task, index) => <button type="button" className={`task-row ${doneTasks[index] ? "task-done" : ""}`} key={task.title} onClick={() => setDoneTasks((current) => current.map((value, taskIndex) => taskIndex === index ? !value : value))}><span className={`task-check ${doneTasks[index] ? "checked" : ""}`}>{doneTasks[index] && <Check size={13} />}</span><span className="task-copy"><strong>{task.title}</strong><span><Clock3 size={13} /> {task.due}</span></span><span className={`priority priority-${task.priority.toLowerCase()}`}>{task.priority}</span></button>)}</div></article>
      <article className="panel activity-panel"><PanelHeading title="Recent activity" detail="Updates across your work" action="See notifications" onAction={() => onNavigate("Notifications")} /><div className="activity-list"><ActivityRow icon={CheckCheck} tone="green" title="Lead qualified" detail="Acme Corporation moved to Qualified" time="24 min ago" /><ActivityRow icon={Handshake} tone="blue" title="Deal updated" detail="Northwind renewal · $18,200" time="1 hr ago" /><ActivityRow icon={CalendarDays} tone="purple" title="Meeting scheduled" detail="Discovery call with Globex Solutions" time="3 hrs ago" /></div></article>
    </section>
  </>;
}

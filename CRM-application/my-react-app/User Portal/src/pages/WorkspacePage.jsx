import { useEffect, useMemo, useState } from "react";
import { Bell, BriefcaseBusiness, CalendarDays, Check, CheckCheck, CircleHelp, Clock3, DollarSign, Download, Filter, Mail, Plus, Search, Send, TrendingUp, Users, X } from "lucide-react";
import { getLeads, updateLead } from "../../../src/client-admin-portal/Api/Leads";
import { getDeals, updateDeal } from "../../../src/client-admin-portal/Api/Deals";
import { createTask, getTasks, updateTask } from "../../../src/client-admin-portal/Api/Tasks";
import { usePortal } from "../context/PortalContext";

const sampleLeads = [
  { id: "l1", name: "Acme Corporation", contactName: "Olivia Chen", email: "olivia@acme.com", company: "Acme Corporation", source: "Website", status: "Qualified", value: 24500, updatedAt: "Today", description: "Interested in streamlining sales follow-ups across the account team. Schedule a discovery call to confirm requirements and decision timeline." },
  { id: "l2", name: "Northwind Traders", contactName: "James Wilson", email: "james@northwind.io", company: "Northwind Traders", source: "Referral", status: "Contacted", value: 18200, updatedAt: "Yesterday", description: "Referred by an existing customer and evaluating a CRM rollout. Follow up about team size, onboarding needs, and renewal timing." },
  { id: "l3", name: "Globex Solutions", contactName: "Priya Shah", email: "priya@globex.com", company: "Globex Solutions", source: "LinkedIn", status: "New", value: 12800, updatedAt: "Nov 3", description: "New prospect from LinkedIn. Introduce the CRM workflow tools and learn more about their current sales process." },
  { id: "l4", name: "Stark Consulting", contactName: "Noah Kim", email: "noah@stark.co", company: "Stark Consulting", source: "Event", status: "Proposal", value: 31000, updatedAt: "Nov 2", description: "Discussed advisory and pipeline reporting needs at the recent event. Proposal is underway; follow up on questions and approval steps." },
  { id: "l5", name: "Wayne Enterprises", contactName: "Taylor Reed", email: "taylor@wayne.com", company: "Wayne Enterprises", source: "Website", status: "New", value: 9400, updatedAt: "Nov 1", description: "Submitted an inquiry through the website. Contact Taylor to understand their priorities and arrange an introductory call." }
];
const sampleDeals = [
  { id: "d1", name: "Acme annual renewal", company: "Acme Corporation", stage: "Negotiation", value: 24500, closeDate: "2026-11-18", probability: 80, description: "Annual CRM subscription renewal with expanded sales team access. Finalize seat count, renewal terms, and approval with the account team." },
  { id: "d2", name: "Northwind CRM rollout", company: "Northwind Traders", stage: "Proposal", value: 18200, closeDate: "2026-11-24", probability: 60, description: "Proposed phased CRM rollout for Northwind's sales team, including onboarding and pipeline setup. Awaiting feedback on scope and timeline." },
  { id: "d3", name: "Globex implementation", company: "Globex Solutions", stage: "Qualified", value: 12800, closeDate: "2026-12-04", probability: 40, description: "Potential CRM implementation project. Confirm integration requirements and the stakeholders involved before preparing a proposal." },
  { id: "d4", name: "Stark advisory package", company: "Stark Consulting", stage: "Won", value: 31000, closeDate: "2026-10-28", probability: 100, description: "Advisory package covering pipeline reporting and sales process improvements. Agreement is won; coordinate kickoff and delivery dates." },
  { id: "d5", name: "Wayne support plan", company: "Wayne Enterprises", stage: "New", value: 9400, closeDate: "2026-12-12", probability: 20, description: "Initial opportunity for an ongoing support plan. Discuss coverage needs, response expectations, and contract options with the customer." }
];
const sampleTasks = [
  { id: "sample-task-1", title: "Send revised proposal to Acme Corp.", due: "2026-11-10", time: "11:30", priority: "High", status: "TODO" },
  { id: "sample-task-2", title: "Follow up with James Wilson", due: "2026-11-10", time: "14:00", priority: "Medium", status: "TODO" },
  { id: "sample-task-3", title: "Prepare discovery call notes", due: "2026-11-11", time: "09:00", priority: "Low", status: "COMPLETED" },
  { id: "sample-task-4", title: "Review Globex requirements", due: "2026-11-12", time: "10:00", priority: "Medium", status: "TODO" }
];
const notificationIcons = { lead: CheckCheck, deal: BriefcaseBusiness, calendar: CalendarDays, task: Clock3 };
const money = (amount) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(Number(amount) || 0);
const dateText = (value) => value ? new Date(`${String(value).slice(0, 10)}T12:00:00`).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) : "No due date";
const unwrap = (data) => Array.isArray(data) ? data : data?.items || data?.leads || data?.deals || data?.tasks || [];

export default function WorkspacePage({ title, description }) {
  const { notifications: noticeList, saveNotifications } = usePortal();
  const [leads, setLeads] = useState(sampleLeads);
  const [deals, setDeals] = useState(sampleDeals);
  const [tasks, setTasks] = useState(sampleTasks);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("All");
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [taskTitle, setTaskTitle] = useState("");
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    if (!["My Leads", "My Deals", "Tasks"].includes(title)) return () => { active = false; };
    const loaders = { "My Leads": [getLeads, setLeads, sampleLeads], "My Deals": [getDeals, setDeals, sampleDeals], Tasks: [getTasks, setTasks, sampleTasks] };
    const [load, setter, fallback] = loaders[title];
    setLoading(true);
    load().then((data) => { if (active && unwrap(data).length) setter(unwrap(data).map((item) => ({ ...item, id: String(item.id) }))); }).catch(() => { if (active) setter(fallback); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [title]);

  const filteredLeads = useMemo(() => leads.filter((item) => `${item.name || item.company || ""} ${item.email || ""} ${item.contactName || ""}`.toLowerCase().includes(query.toLowerCase()) && (filter === "All" || item.status === filter)), [leads, query, filter]);
  const filteredDeals = useMemo(() => deals.filter((item) => `${item.name || ""} ${item.company || ""}`.toLowerCase().includes(query.toLowerCase()) && (filter === "All" || item.stage === filter)), [deals, query, filter]);
  const filteredTasks = useMemo(() => tasks.filter((item) => `${item.title || ""}`.toLowerCase().includes(query.toLowerCase()) && (filter === "All" || (filter === "Completed" ? item.status === "COMPLETED" || item.completed : item.status !== "COMPLETED" && !item.completed))), [tasks, query, filter]);

  async function changeStatus(kind, item, value) {
    const setter = kind === "lead" ? setLeads : setDeals;
    const key = kind === "lead" ? "status" : "stage";
    setter((items) => items.map((row) => row.id === item.id ? { ...row, [key]: value } : row));
    try { await (kind === "lead" ? updateLead : updateDeal)(item.id, { [key]: value }); }
    catch { setFeedback("Saved on this device. Changes will sync when CRM access is available."); }
  }
  async function toggleTask(task) {
    const done = !(task.status === "COMPLETED" || task.completed);
    const setter = (items) => items.map((row) => row.id === task.id ? { ...row, completed: done, status: done ? "COMPLETED" : "TODO" } : row);
    setTasks(setter);
    if (!String(task.id).startsWith("sample-task-")) try { await updateTask(task.id, { completed: done, status: done ? "COMPLETED" : "TODO" }); } catch { setFeedback("Task updated on this device; sync is unavailable."); }
  }
  async function addTask(event) {
    event.preventDefault();
    const task = { id: `local-task-${Date.now()}`, title: taskTitle.trim(), due: new Date().toISOString().slice(0, 10), time: "09:00", priority: "Medium", status: "TODO" };
    if (!task.title) return;
    setTasks((items) => [task, ...items]); setTaskTitle(""); setShowTaskForm(false);
    try { const saved = await createTask({ title: task.title, due: task.due, priority: task.priority, status: task.status }); if (saved?.id) setTasks((items) => items.map((row) => row.id === task.id ? { ...row, id: String(saved.id) } : row)); }
    catch { setFeedback("Task saved on this device. It will sync when CRM access is available."); }
  }
  function markRead(id) { const next = noticeList.map((item) => item.id === id ? { ...item, read: true } : item); saveNotifications(next); }
  function exportReport() {
    const rows = [["Metric", "Value"], ["Leads", leads.length], ["Qualified leads", leads.filter((item) => item.status === "Qualified").length], ["Open deals", deals.filter((item) => !["Won", "Lost"].includes(item.stage)).length], ["Pipeline value", deals.filter((item) => !["Won", "Lost"].includes(item.stage)).reduce((sum, item) => sum + Number(item.value || 0), 0)], ["Won revenue", deals.filter((item) => item.stage === "Won").reduce((sum, item) => sum + Number(item.value || 0), 0)]];
    const csv = rows.map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" })); const link = document.createElement("a"); link.href = url; link.download = "my-crm-report.csv"; link.click(); URL.revokeObjectURL(url);
  }

  return <div className="workspace-page">
    {feedback && <div className="workspace-feedback" role="status">{feedback}<button onClick={() => setFeedback("")}>Dismiss</button></div>}
    {title === "My Leads" && <><section className="workspace-intro panel"><div><span className="eyebrow">LEAD MANAGEMENT</span><h2>Your leads, all in one place</h2><p>Review your assigned prospects and keep each follow-up moving.</p></div><div className="workspace-kpi"><Users size={18}/><strong>{leads.length}</strong><span>assigned leads</span></div></section><ListToolbar query={query} setQuery={setQuery} filter={filter} setFilter={setFilter} options={["All", "New", "Contacted", "Qualified", "Proposal"]} label="Search leads" /><section className="panel data-panel"><PanelHeading title="Assigned leads" detail={`${filteredLeads.length} records`} /><div className="table-scroll"><table className="leads-table"><thead><tr><th>Lead</th><th>Source</th><th>Estimated value</th><th>Updated</th><th>Status</th></tr></thead><tbody>{filteredLeads.map((lead, index) => { const leadName = lead.name || lead.company || "Lead"; const statusClass = String(lead.status || "New").toLowerCase(); return <tr key={lead.id} className="clickable-record-row" onClick={() => setSelectedRecord({ type: "lead", item: lead })}><td className="lead-identity-cell"><span className={`lead-initials lead-color-${index % 4}`}>{leadName.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase()}</span><span className="lead-identity-copy"><strong>{leadName}</strong><span>{lead.contactName || lead.name} · {lead.email || "No email"}</span></span></td><td><span className="lead-source-pill">{lead.source || "Unspecified"}</span></td><td className="lead-value-cell">{money(lead.value || lead.estimatedValue)}</td><td>{lead.updatedAt || "Recently"}</td><td><select className={`lead-status-select lead-status-${statusClass}`} aria-label={`Status for ${leadName}`} value={lead.status || "New"} onClick={(event) => event.stopPropagation()} onChange={(event) => changeStatus("lead", lead, event.target.value)}>{["New", "Contacted", "Qualified", "Proposal", "Lost"].map((status) => <option key={status}>{status}</option>)}</select></td></tr>; })}</tbody></table>{filteredLeads.length === 0 && <EmptyResult query={query} />}</div></section></>}
    {title === "My Deals" && <><section className="workspace-intro panel"><div><span className="eyebrow">SALES PIPELINE</span><h2>Keep your opportunities moving</h2><p>Track deal stages, expected close dates, and pipeline value.</p></div><div className="workspace-kpi"><DollarSign size={18}/><strong>{money(deals.filter((item) => !["Won", "Lost"].includes(item.stage)).reduce((sum, item) => sum + Number(item.value || 0), 0))}</strong><span>open pipeline</span></div></section><ListToolbar query={query} setQuery={setQuery} filter={filter} setFilter={setFilter} options={["All", "New", "Qualified", "Proposal", "Negotiation", "Won", "Lost"]} label="Search deals" /><section className="deal-grid">{filteredDeals.map((deal) => <article className="panel deal-card clickable-record-card" key={deal.id} role="button" tabIndex={0} onClick={() => setSelectedRecord({ type: "deal", item: deal })} onKeyDown={(event) => { if (event.target === event.currentTarget && (event.key === "Enter" || event.key === " ")) { event.preventDefault(); setSelectedRecord({ type: "deal", item: deal }); } }}><div className="deal-card-top"><span className="deal-symbol"><BriefcaseBusiness size={17}/></span><span className={`status status-${String(deal.stage || "new").toLowerCase()}`}>{deal.stage || "New"}</span></div><h3>{deal.name}</h3><p>{deal.company || "Unassigned account"}</p><strong className="deal-amount">{money(deal.value || deal.amount)}</strong><div className="deal-progress"><span><i style={{ width: `${deal.probability ?? (deal.stage === "Won" ? 100 : 40)}%` }}/></span><small>{deal.probability ?? (deal.stage === "Won" ? 100 : 40)}% probability</small></div><div className="deal-card-foot"><span>Close {dateText(deal.closeDate || deal.expectedCloseDate)}</span><select aria-label={`Stage for ${deal.name}`} value={deal.stage || "New"} onClick={(event) => event.stopPropagation()} onChange={(event) => changeStatus("deal", deal, event.target.value)}>{["New", "Qualified", "Proposal", "Negotiation", "Won", "Lost"].map((stage) => <option key={stage}>{stage}</option>)}</select></div></article>)}{filteredDeals.length === 0 && <EmptyResult query={query}/>}</section></>}
    {title === "Tasks" && <><section className="workspace-intro panel"><div><span className="eyebrow">MY WORK</span><h2>Make progress on what matters</h2><p>Prioritize your follow-ups and keep your commitments on track.</p></div><button className="primary-button" onClick={() => setShowTaskForm((open) => !open)}><Plus size={16}/> Add a task</button></section>{showTaskForm && <form className="panel task-create-form" onSubmit={addTask}><label htmlFor="task-title">Task name</label><input id="task-title" autoFocus required value={taskTitle} onChange={(event) => setTaskTitle(event.target.value)} placeholder="e.g. Call back a prospect"/><button className="primary-button"><Plus size={15}/> Create task</button></form>}<ListToolbar query={query} setQuery={setQuery} filter={filter} setFilter={setFilter} options={["All", "Pending", "Completed"]} label="Search tasks" /><section className="panel data-panel"><PanelHeading title="Your task list" detail={`${filteredTasks.length} tasks`} /><div className="task-table-list">{filteredTasks.map((task) => { const done = task.status === "COMPLETED" || task.completed; return <div className={`task-table-row ${done ? "task-done" : ""}`} key={task.id}><button className={`task-check ${done ? "checked" : ""}`} onClick={() => toggleTask(task)} aria-label={done ? "Mark pending" : "Mark complete"}>{done && <Check size={13}/>}</button><div className="task-copy"><strong>{task.title}</strong><span><Clock3 size={13}/> {dateText(task.due || task.dueDate)}{task.time ? ` · ${task.time}` : ""}</span></div><span className={`priority priority-${String(task.priority || "Medium").toLowerCase()}`}>{task.priority || "Medium"}</span></div>; })}{filteredTasks.length === 0 && <EmptyResult query={query}/>}</div></section></>}
    {title === "Reports" && <Reports leads={leads} deals={deals} tasks={tasks} onExport={exportReport} />}
    {title === "Notifications" && <>
      <section className="workspace-intro panel"><div><span className="eyebrow">ACTIVITY CENTER</span><h2>Stay up to date</h2><p>Recent changes and reminders from your CRM workspace.</p></div></section>
      <section className="panel notifications-panel">
        <div className="panel-heading"><div><h3>Recent notifications</h3><p>Your latest activity and reminders</p></div>{noticeList.some((item) => !item.read) && <button className="text-button" onClick={() => saveNotifications(noticeList.map((item) => ({ ...item, read: true })))}>Mark all read <Check size={14}/></button>}</div>
        {noticeList.length === 0 ? <div className="workspace-empty"><Bell size={22}/><strong>You’re all caught up</strong><span>New notifications will appear here.</span></div> : noticeList.map((item) => {
          const Icon = notificationIcons[item.iconName] || Bell;
          return <button className={`notice-row ${item.read ? "read" : ""}`} key={item.id} onClick={() => markRead(item.id)}><span className={`activity-icon tone-${item.tone || "blue"}`}><Icon size={16}/></span><span className="notice-copy"><strong>{item.title}</strong><span>{item.detail}</span></span><time>{item.time}</time>{!item.read && <i className="notice-unread"/>}</button>;
        })}
      </section>
    </>}
    {title === "Help" && <HelpCenter />}
    {!(["My Leads", "My Deals", "Tasks", "Reports", "Notifications", "Help"].includes(title)) && <section className="page-panel panel"><div className="empty-icon"><CircleHelp size={25}/></div><span className="eyebrow">YOUR WORKSPACE</span><h2>{title}</h2><p>{description}</p></section>}
    {loading && <div className="workspace-loading" role="status">Refreshing your CRM data…</div>}
    {selectedRecord && <RecordDetailsModal record={selectedRecord} onClose={() => setSelectedRecord(null)} />}
  </div>;
}

function RecordDetailsModal({ record, onClose }) {
  const { item, type } = record;
  const isLead = type === "lead";
  const title = isLead ? item.name || item.company || "Lead details" : item.name || "Deal details";
  const stage = isLead ? item.status || "New" : item.stage || "New";
  const rows = isLead ? [
    ["Contact", item.contactName || "Not provided"], ["Email", item.email || "Not provided"],
    ["Company", item.company || item.name || "Not provided"], ["Source", item.source || "Unspecified"],
    ["Estimated value", money(item.value || item.estimatedValue)], ["Last updated", item.updatedAt || "Recently"],
    ["Description", item.description || item.notes || `Prospect from ${item.source || "CRM"}. Follow up to understand their needs and agree on next steps.`]
  ] : [
    ["Company", item.company || "Unassigned account"], ["Deal value", money(item.value || item.amount)],
    ["Expected close", dateText(item.closeDate || item.expectedCloseDate)],
    ["Probability", `${item.probability ?? (stage === "Won" ? 100 : 40)}%`],
    ["Contact", item.contactName || item.contact || "Not provided"], ["Description", item.description || item.notes || `Opportunity for ${item.company || "this account"}. Confirm the scope, decision process, and next steps with the customer.`]
  ];
  return <div className="modal-backdrop" onClick={onClose}><section className="account-modal record-details-modal" role="dialog" aria-modal="true" aria-labelledby="record-details-title" onClick={(event) => event.stopPropagation()}><div className="modal-heading"><span className="empty-icon"><BriefcaseBusiness size={21}/></span><div><span className="eyebrow">{isLead ? "LEAD DETAILS" : "DEAL DETAILS"}</span><h2 id="record-details-title">{title}</h2></div><button type="button" className="modal-close" onClick={onClose} aria-label="Close details"><X size={18}/></button></div><div className="record-details-stage"><span>Status</span><b className={`status status-${String(stage).toLowerCase()}`}>{stage}</b></div><div className="record-details-grid">{rows.map(([label, value]) => <div className="record-detail-field" key={label}><span>{label}</span><strong>{value}</strong></div>)}</div><div className="modal-actions"><button type="button" className="secondary-button" onClick={onClose}>Close</button></div></section></div>;
}

function PanelHeading({ title, detail }) { return <div className="panel-heading"><div><h3>{title}</h3><p>{detail}</p></div></div>; }
function ListToolbar({ query, setQuery, filter, setFilter, options, label }) { return <div className="list-toolbar"><label className="list-search"><Search size={16}/><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={label}/></label><label className="list-filter"><Filter size={15}/><select value={filter} onChange={(event) => setFilter(event.target.value)}>{options.map((item) => <option key={item}>{item}</option>)}</select></label></div>; }
function EmptyResult({ query }) { return <div className="workspace-empty"><Search size={21}/><strong>{query ? "No matching records" : "Nothing here yet"}</strong><span>{query ? "Try another search term or status." : "New items will appear here when assigned to you."}</span></div>; }
function Reports({ leads, deals, tasks, onExport }) {
  const stages = ["New", "Qualified", "Proposal", "Negotiation", "Won"];
  const leadCount = (stage) => leads.filter((item) => item.status === stage).length;
  const openDeals = deals.filter((item) => !["Won", "Lost"].includes(item.stage));
  const max = Math.max(1, ...stages.map((stage) => leadCount(stage)));
  return <><section className="report-heading panel"><div><span className="eyebrow">PERFORMANCE OVERVIEW</span><h2>Your sales at a glance</h2><p>Progress across your assigned leads, deals, and tasks.</p></div><button className="secondary-button" onClick={onExport}><Download size={15}/> Export CSV</button></section><section className="report-stats"><ReportStat icon={Users} label="Assigned leads" value={leads.length} tone="blue"/><ReportStat icon={TrendingUp} label="Qualified" value={leadCount("Qualified")} tone="green"/><ReportStat icon={BriefcaseBusiness} label="Open deals" value={openDeals.length} tone="orange"/><ReportStat icon={DollarSign} label="Won revenue" value={money(deals.filter((item) => item.stage === "Won").reduce((sum, item) => sum + Number(item.value || 0), 0))} tone="purple"/></section><section className="report-panels"><article className="panel report-chart"><PanelHeading title="Lead pipeline" detail="Leads by current status"/>{stages.map((stage) => <div className="report-bar-row" key={stage}><span>{stage}</span><div><i style={{ width: `${leadCount(stage) / max * 100}%` }}/></div><strong>{leadCount(stage)}</strong></div>)}</article><article className="panel report-summary"><PanelHeading title="Activity summary" detail="Your current workload"/><div className="summary-line"><span>Pending tasks</span><strong>{tasks.filter((task) => task.status !== "COMPLETED" && !task.completed).length}</strong></div><div className="summary-line"><span>Completed tasks</span><strong>{tasks.filter((task) => task.status === "COMPLETED" || task.completed).length}</strong></div><div className="summary-line"><span>Open pipeline value</span><strong>{money(openDeals.reduce((sum, item) => sum + Number(item.value || 0), 0))}</strong></div><div className="summary-line"><span>Weighted forecast</span><strong>{money(openDeals.reduce((sum, item) => sum + Number(item.value || 0) * Number(item.probability || 0) / 100, 0))}</strong></div></article></section></>;
}
function ReportStat({ icon: Icon, label, value, tone }) { return <article className="panel report-stat"><div className={`stat-icon tone-${tone}`}><Icon size={17}/></div><span>{label}</span><strong>{value}</strong></article>; }
function HelpCenter() {
  const [topic, setTopic] = useState(""); const [sent, setSent] = useState(false);
  return <><section className="workspace-intro panel"><div><span className="eyebrow">SUPPORT</span><h2>How can we help?</h2><p>Find a quick answer or send a message to the support team.</p></div><div className="workspace-kpi"><CircleHelp size={18}/><strong>Here</strong><span>when you need us</span></div></section><div className="help-grid"><section className="panel help-topics"><PanelHeading title="Popular topics" detail="Quick answers to common questions"/><details><summary>How do I update a lead?</summary><p>Open My Leads and use the status menu on the lead row to record its latest stage.</p></details><details><summary>Where can I see my follow-ups?</summary><p>Your tasks and calendar events show upcoming reminders. Mark an item complete when it is done.</p></details><details><summary>How is the pipeline forecast calculated?</summary><p>The weighted forecast multiplies each open deal value by its probability and adds the results.</p></details><details><summary>How do I change my profile details?</summary><p>Open your account from the profile icon in the top bar to review and update your information.</p></details></section><form className="panel help-contact" onSubmit={(event) => { event.preventDefault(); setSent(true); }}><PanelHeading title="Contact support" detail="We usually respond within one business day"/>{sent ? <div className="help-success"><CheckCheck size={24}/><strong>Message received</strong><span>Our support team will follow up with you.</span><button type="button" className="text-button" onClick={() => { setSent(false); setTopic(""); }}>Send another message</button></div> : <><label>Subject<input required value={topic} onChange={(event) => setTopic(event.target.value)} placeholder="What do you need help with?"/></label><label>Message<textarea required rows="5" placeholder="Share a few details so we can help."/></label><button className="primary-button"><Send size={15}/> Send message</button><a className="support-email" href="mailto:support@shnoor.com"><Mail size={14}/> support@shnoor.com</a></>}</form></div></>;
}

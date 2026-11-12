import { TrendingUp } from "lucide-react";

export function StatCard({ title, value, delta, icon: Icon, tone, note }) {
  return <article className="stat-card"><div className="stat-top"><span>{title}</span><span className={`stat-icon tone-${tone}`}><Icon size={18} /></span></div><strong className="stat-value">{value}</strong><div className="stat-foot"><span className="growth"><TrendingUp size={14} /> {delta}</span><span>{note}</span></div></article>;
}

export function PanelHeading({ title, detail, action, onAction }) {
  return <div className="panel-heading"><div><h3>{title}</h3><p>{detail}</p></div><button className="text-button" onClick={onAction}>{action}<span>→</span></button></div>;
}

export function ActivityRow({ icon: Icon, tone, title, detail, time }) {
  return <div className="activity-row"><span className={`activity-icon tone-${tone}`}><Icon size={16} /></span><div><strong>{title}</strong><span>{detail}</span></div><time>{time}</time></div>;
}

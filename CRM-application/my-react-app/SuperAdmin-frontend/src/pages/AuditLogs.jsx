import { usePlatform } from "../context/PlatformContext";

export default function AuditLogs() {
  const { data, apiLoading, apiError } = usePlatform();
  return (
    <section className="panel page-panel">
      <div className="panel-title"><div><h3>Audit Logs</h3><p>Super Admin, organization, plan, support, and user changes recorded in the CRM database.</p></div></div>
      {apiError && <div className="inline-error" role="alert">{apiError}</div>}
      {apiLoading ? <p className="empty-state">Loading audit logs…</p> : data.auditLogs.length === 0 ? (
        <p className="empty-state">No audit activity has been recorded yet.</p>
      ) : (
        <div className="table-wrap"><table><thead><tr><th>Action</th><th>Details</th><th>Actor</th><th>Time</th></tr></thead><tbody>{data.auditLogs.map((log) => <tr key={log.id}><td><strong>{log.action}</strong></td><td>{log.detail}</td><td>{log.actor}</td><td>{new Date(log.createdAt).toLocaleString()}</td></tr>)}</tbody></table></div>
      )}
    </section>
  );
}

import { useState } from "react";
import DetailsModal from "../components/DetailsModal";

const logs = [
  { id: "AUD-901", action: "Organization suspended", user: "Super Admin", target: "PixelForge Studio", time: "Today, 10:42 AM" },
  { id: "AUD-902", action: "Subscription changed", user: "Meera Iyer", target: "NovaStack Labs", time: "Today, 9:18 AM" },
  { id: "AUD-903", action: "Subscription renewed", user: "System", target: "ABC Technologies", time: "Yesterday, 6:40 PM" },
  { id: "AUD-904", action: "Organization activated", user: "Super Admin", target: "Vertex Commerce", time: "Yesterday, 2:11 PM" }
];

export default function AuditLogs() {
  const [selected, setSelected] = useState(null);

  return (
    <>
      <section className="panel page-panel">
        <div className="panel-title">
          <div>
            <h3>Recent Activity</h3>
            <p>Latest platform actions</p>
          </div>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Action</th>
                <th>User</th>
                <th>Target</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} onClick={() => setSelected(log)}>
                  <td><strong>{log.action}</strong><span>{log.id}</span></td>
                  <td>{log.user}</td>
                  <td>{log.target}</td>
                  <td>{log.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <DetailsModal
        title={selected?.action}
        rows={selected ? [
          ["Audit ID", selected.id],
          ["User", selected.user],
          ["Target", selected.target],
          ["Time", selected.time]
        ] : []}
        onClose={() => setSelected(null)}
      />
    </>
  );
}

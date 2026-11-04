import { useState } from "react";
import DetailsModal from "../components/DetailsModal";
import Status from "../components/Status";
import { organizations } from "../data";

export default function Organizations() {
  const [selected, setSelected] = useState(null);
  return (
    <>
      <section className="panel page-panel">
        <div className="panel-title"><div><h3>All Organizations</h3><p>{organizations.length} organizations shown</p></div></div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Organization</th><th>Admin</th><th>Plan</th><th>Users</th><th>Status</th></tr></thead>
            <tbody>
              {organizations.map((org) => (
                <tr key={org.id} onClick={() => setSelected(org)}>
                  <td><strong>{org.name}</strong><span>{org.id}</span></td>
                  <td>{org.admin}</td><td>{org.plan}</td><td>{org.users}</td><td><Status value={org.status}/></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <DetailsModal title={selected?.name} rows={selected ? [["Organization ID", selected.id], ["Admin", selected.admin], ["Plan", selected.plan], ["Users", String(selected.users)], ["Status", selected.status]] : []} onClose={() => setSelected(null)} />
    </>
  );
}

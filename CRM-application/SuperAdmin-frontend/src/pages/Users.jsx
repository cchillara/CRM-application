import { useState } from "react";
import DetailsModal from "../components/DetailsModal";
import Status from "../components/Status";
import { users } from "../data";

export default function Users() {
  const [selected, setSelected] = useState(null);
  return (
    <>
      <section className="panel page-panel">
        <div className="panel-title"><div><h3>Platform Users</h3><p>Users from customer organizations</p></div></div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>User</th><th>Organization</th><th>Role</th><th>Status</th></tr></thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} onClick={() => setSelected(user)}>
                  <td><strong>{user.name}</strong><span>{user.email}</span></td>
                  <td>{user.organization}</td><td>{user.role}</td><td><Status value={user.status}/></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <DetailsModal title={selected?.name} rows={selected ? [["User ID", selected.id], ["Email", selected.email], ["Organization", selected.organization], ["Role", selected.role], ["Status", selected.status]] : []} onClose={() => setSelected(null)} />
    </>
  );
}

import { useEffect, useState } from 'react';
import { Mail, Plus, UserRound, X } from 'lucide-react';
import { createUser, getUsers } from '../Api/Users';

const emptyForm = { firstName: '', lastName: '', email: '', role: 'USER' };

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    let active = true;
    getUsers().then(data => { if (active) setUsers(Array.isArray(data) ? data : []); })
      .catch(requestError => { if (active) setError(requestError.message || 'Could not load users.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  function closeModal() { setModalOpen(false); setForm(emptyForm); }

  async function submit(event) {
    event.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');
    try {
      const saved = await createUser({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim().toLowerCase(),
        role: form.role,
        status: 'INVITED',
      });
      if (saved?.id) setUsers(current => [saved, ...current]);
      setMessage(`Invitation record created for ${form.email.trim()}. Ask them to sign up with this email.`);
      closeModal();
    } catch (requestError) {
      setError(requestError.message || 'Could not create the user invitation.');
    } finally { setSaving(false); }
  }

  return <div className="crm-dashboard">
    <div className="crm-top-header">
      <div><h1 className="crm-page-title">User Management</h1><p className="crm-page-subtitle">Invite people to your organization and assign CRM access.</p></div>
      <button type="button" className="crm-banner-btn crm-btn-primary" onClick={() => { setError(''); setMessage(''); setModalOpen(true); }}><Plus size={16} /><span>Invite User</span></button>
    </div>
    {error && <div className="user-admin-message error" role="alert">{error}</div>}
    {message && <div className="user-admin-message success" role="status">{message}</div>}
    <div className="crm-card">
      <div className="crm-table-container"><table className="crm-table"><thead><tr><th>User</th><th>Email</th><th>CRM Role</th><th>Status</th></tr></thead>
        <tbody>{users.map(user => <tr key={user.id}><td><span className="user-admin-name"><UserRound size={16} />{[user.firstName, user.lastName].filter(Boolean).join(' ') || 'Invited user'}</span></td><td>{user.email}</td><td>{user.role}</td><td><span className={`crm-status-badge ${user.status === 'ACTIVE' ? 'badge-active' : 'badge-progress'}`}>{user.status}</span></td></tr>)}</tbody>
      </table>{loading && <div className="crm-empty-state">Loading users…</div>}{!loading && users.length === 0 && <div className="crm-empty-state">No users have been added to this organization.</div>}</div>
    </div>
    {modalOpen && <div className="crm-modal-backdrop" onClick={closeModal}><div className="crm-modal-card" role="dialog" aria-modal="true" aria-labelledby="invite-user-title" onClick={event => event.stopPropagation()}>
      <div className="crm-modal-header"><div><h2 id="invite-user-title" className="crm-modal-title">Invite a user</h2><p className="crm-card-subtitle" style={{ margin: 0 }}>They will sign up using the invited email address.</p></div><button type="button" className="crm-modal-close-btn" onClick={closeModal} aria-label="Close"><X size={18} /></button></div>
      <form onSubmit={submit}><div className="crm-modal-body">
        <div className="user-admin-form-row"><label className="crm-form-group"><span className="crm-form-label">First name *</span><input className="crm-form-input" required value={form.firstName} onChange={event => setForm(current => ({ ...current, firstName: event.target.value }))} /></label><label className="crm-form-group"><span className="crm-form-label">Last name</span><input className="crm-form-input" value={form.lastName} onChange={event => setForm(current => ({ ...current, lastName: event.target.value }))} /></label></div>
        <label className="crm-form-group"><span className="crm-form-label">Email address *</span><input className="crm-form-input" required type="email" value={form.email} onChange={event => setForm(current => ({ ...current, email: event.target.value }))} /></label>
        <label className="crm-form-group"><span className="crm-form-label">CRM role *</span><select className="crm-form-select" value={form.role} onChange={event => setForm(current => ({ ...current, role: event.target.value }))}><option value="USER">User Portal User</option><option value="SALES">Sales</option><option value="MANAGER">Manager</option></select></label>
        <p className="user-admin-hint"><Mail size={15} /> The person must complete signup with this same email before they can access the portal.</p>
      </div><div className="crm-modal-footer"><button type="button" className="crm-btn-secondary" onClick={closeModal}>Cancel</button><button type="submit" className="crm-banner-btn crm-btn-primary" disabled={saving}>{saving ? 'Creating…' : 'Create invitation'}</button></div></form>
    </div></div>}
  </div>;
}

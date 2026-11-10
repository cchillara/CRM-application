import React, { useState, useEffect } from 'react';
import { employeesList } from '../data';
import { getStored, setStored } from '../storage';
import { UserCog, Plus, X, Pencil, Trash2 } from 'lucide-react';
import { getEmployees, createEmployee, updateEmployee, deleteEmployee } from './../Api/Employee';
import "../styles/Leads.css"
const STORAGE_KEY = 'employees';
const EMPTY_FORM = { name: '', email: '', department: 'Sales & Accounts', role: '', phone: '', status: 'Full-time' };
const DEPARTMENTS = ['Sales & Accounts', 'Solutions & Deals', 'Enterprise Sales', 'Customer Success', 'Technical Support', 'Product Marketing', 'Executive'];

export default function Employee() {
  const [employees, setEmployees] = useState(() => getStored(STORAGE_KEY, employeesList));
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const persist = (updated) => { setEmployees(updated); setStored(STORAGE_KEY, updated); };

  // use effect
  useEffect(() => {
    getEmployees()
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          const mapped = data.map((e) => ({
            id: e.id,
            name: e.name || `${e.firstName || ''} ${e.lastName || ''}`.trim() || 'Employee',
            email: e.email || '',
            department: e.department || 'Sales & Accounts',
            role: e.role || 'Account Executive',
            phone: e.phone || '+91 98000 00000',
            status: e.status || (e.rawStatus === 'ACTIVE' ? 'Full-time' : 'Part-time'),
          }));
          persist(mapped);
        }
      })
      .catch((err) => console.warn('[Employee] API unavailable, using local data:', err.message));
  }, []);


  //arrow functions

  const openAdd = () => { setEditingEmployee(null); setForm(EMPTY_FORM); setIsModalOpen(true); };
  const openEdit = (emp) => {
    setEditingEmployee(emp);
    setForm({ name: emp.name, email: emp.email, department: emp.department, role: emp.role, phone: emp.phone, status: emp.status });
    setIsModalOpen(true);
  };


  const handleClose = () => { setIsModalOpen(false); setEditingEmployee(null); setForm(EMPTY_FORM); };
  const handleChange = (e) => { const { name, value } = e.target; setForm(p => ({ ...p, [name]: value })); };


  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) { alert('Please enter name and email.'); return; }
    const payload = {
      name: form.name.trim(),
      firstName: form.name.trim().split(' ')[0],
      lastName: form.name.trim().split(' ').slice(1).join(' '),
      email: form.email.trim(),
      department: form.department,
      role: form.role.trim() || 'Account Executive',
      phone: form.phone.trim() || '+91 98000 00000',
      status: form.status
    };
    if (editingEmployee) {
      const optimistic = {
        ...editingEmployee, ...payload
      };
      persist(employees.map(e => e.id === editingEmployee.id ? optimistic : e));
      try {
        const saved = await updateEmployee(editingEmployee.id, payload);
        if (saved) {
          setEmployees(prev => {
            const updated = prev.map(e => e.id === editingEmployee.id ? { ...e, ...saved } : e);
            setStored(STORAGE_KEY, updated);
            return updated;
          });
        }
      }
      catch (err) { console.warn('[Employee] Update API error:', err.message); }
    }

    else {
      const created = {
        id: `EMP-${String(employees.length + 1).padStart(3, '0')}`,
        ...payload
      };
      persist([created, ...employees]);
      try {
        const saved = await createEmployee(payload);
        if (saved?.id) {
          setEmployees(prev => {
            const updated = prev.map(e => e.id === created.id ? { ...e, ...saved } : e);
            setStored(STORAGE_KEY, updated);
            return updated;
          });
        }
      } catch (err) { console.warn('[Employee] Create API error:', err.message); }
    }
    handleClose();
  };


  const handleDelete = async (id) => {
    if (!window.confirm('Remove this employee record?')) return;
    persist(employees.filter(e => e.id !== id));
    try { await deleteEmployee(id); }
    catch (err) { console.warn('[Employee] Delete API error:', err.message); }
  };

  return (
    <div className="crm-dashboard">
      <div className="crm-top-header">
        <div>
          <h1 className="crm-page-title">Employee Directory</h1>
          <p className="crm-page-subtitle">Internal staff, account managers, and permissions</p>
        </div>
        <button type="button" className="crm-banner-btn crm-btn-primary" onClick={openAdd}>
          <Plus size={16} /><span>Add Employee</span>
        </button>
      </div>

      {isModalOpen && (
        <div className="crm-modal-backdrop" onClick={handleClose}>
          <div className="crm-modal-card" onClick={e => e.stopPropagation()}>
            <div className="crm-modal-header">
              <div>
                <h2 className="crm-modal-title">{editingEmployee ? 'Edit Employee' : 'Add New Employee'}</h2>
                <p className="crm-card-subtitle" style={{ margin: 0 }}>
                  {editingEmployee ? `Editing: ${editingEmployee.id}` : 'Create employee record and access profile'}
                </p>
              </div>
              <button type="button" className="crm-modal-close-btn" onClick={handleClose}><X size={18} /></button>
            </div>
            <form onSubmit={handleSave}>
              <div className="crm-modal-body">
                <div className="crm-form-group">
                  <label className="crm-form-label">Full Name *</label>
                  <input type="text" name="name" value={form.name} onChange={handleChange}
                    placeholder="e.g. Priyanka Sen" className="crm-form-input" required autoFocus />
                </div>
                <div className="crm-form-row">
                  <div className="crm-form-group">
                    <label className="crm-form-label">Work Email *</label>
                    <input type="email" name="email" value={form.email} onChange={handleChange}
                      placeholder="priyanka.s@crmclient.com" className="crm-form-input" required />
                  </div>
                  <div className="crm-form-group">
                    <label className="crm-form-label">Phone Number</label>
                    <input type="text" name="phone" value={form.phone} onChange={handleChange}
                      placeholder="+91 98777 88899" className="crm-form-input" />
                  </div>
                </div>
                <div className="crm-form-row">
                  <div className="crm-form-group">
                    <label className="crm-form-label">Department</label>
                    <select name="department" value={form.department} onChange={handleChange} className="crm-form-select">
                      {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                  <div className="crm-form-group">
                    <label className="crm-form-label">Employment Status</label>
                    <select name="status" value={form.status} onChange={handleChange} className="crm-form-select">
                      {['Full-time', 'Contract', 'Part-time', 'Intern'].map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
                <div className="crm-form-group">
                  <label className="crm-form-label">Role / Designation</label>
                  <input type="text" name="role" value={form.role} onChange={handleChange}
                    placeholder="e.g. Senior Business Development Rep" className="crm-form-input" />
                </div>
              </div>
              <div className="crm-modal-footer">
                <button type="button" className="crm-btn-secondary" onClick={handleClose}>Cancel</button>
                <button type="submit" className="crm-banner-btn crm-btn-primary">
                  {editingEmployee ? 'Update Employee' : 'Save Employee'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="crm-card">
        <div className="crm-table-container">
          <table className="crm-table">
            <thead>
              <tr>
                <th>Employee & ID</th>
                <th>Contact Email</th>
                <th>Department</th>
                <th>Role / Designation</th>
                <th>Phone Number</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((emp) => (
                <tr key={emp.id}>
                  <td>
                    <div className="crm-table-user-cell">
                      <div className="crm-avatar-pill" style={{ backgroundColor: '#ecfdf5', color: '#047857' }}>
                        <UserCog size={18} />
                      </div>
                      <div>
                        <span className="crm-table-primary-text">{emp.name}</span>
                        <span className="crm-table-sub-text">{emp.id}</span>
                      </div>
                    </div>
                  </td>
                  <td><span className="crm-table-sub-text">{emp.email}</span></td>
                  <td><span className="crm-table-primary-text">{emp.department}</span></td>
                  <td><span className="crm-table-sub-text">{emp.role}</span></td>
                  <td>{emp.phone}</td>
                  <td>
                    <span className={`crm-status-badge ${emp.status === 'Full-time' ? 'badge-active' : 'badge-progress'}`}>
                      {emp.status}
                    </span>
                  </td>
                  <td>
                    <div className="crm-row-actions">
                      <button type="button" className="crm-action-icon-btn" title="Edit employee" onClick={() => openEdit(emp)}>
                        <Pencil size={14} />
                      </button>
                      <button type="button" className="crm-action-icon-btn danger" title="Delete employee" onClick={() => handleDelete(emp.id)}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {employees.length === 0 && <div className="crm-empty-state">No employees found.</div>}
        </div>
      </div>
    </div>
  );
}

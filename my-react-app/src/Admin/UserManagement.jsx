import React, { useState } from "react";
import { NavLink, Route, Routes, useNavigate } from "react-router-dom";
import "./Client.css";
import {
    CLIENT_COMPANY_DETAILS,
    CLIENT_COMPANY_CONTRACTS,
    CLIENT_COMPANY_FINANCE,
    CLIENT_COMPANY_TICKETS
} from "./ClientData";

const ROLE_OPTIONS = ["Manager", "Employee", "Support User", "Finance User", "Viewer"];

function UserMngt() {
    const navigate = useNavigate();
    const company = CLIENT_COMPANY_DETAILS();
    const contracts = CLIENT_COMPANY_CONTRACTS();
    const finance = CLIENT_COMPANY_FINANCE();
    const tickets = CLIENT_COMPANY_TICKETS();

    const [users, setUsers] = useState(company.users);
    const [showForm, setShowForm] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(null);
    const [formData, setFormData] = useState({ name: "", role: "Employee", email: "" });
    const [formError, setFormError] = useState("");

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setFormError("");
    };

    const handleAddUser = (e) => {
        e.preventDefault();
        if (!formData.name.trim() || !formData.email.trim()) {
            setFormError("Name and email are required.");
            return;
        }
        const emailExists = users.some(u => u.email.toLowerCase() === formData.email.toLowerCase().trim());
        if (emailExists) {
            setFormError("A user with this email already exists.");
            return;
        }
        setUsers([...users, {
            name: formData.name.trim(),
            role: formData.role,
            email: formData.email.trim(),
        }]);
        setFormData({ name: "", role: "Employee", email: "" });
        setShowForm(false);
        setFormError("");
    };

    const handleDeleteUser = (index) => {
        setUsers(users.filter((_, i) => i !== index));
        setConfirmDelete(null);
    };

    const getRoleInitial = (name) => name ? name.charAt(0).toUpperCase() : "U";

    return (
        <>
            <div className="user-mngt">
                <div className="users">
                    <div className="users-heading-row">
                        <div>
                            <h2>User Management</h2>
                            <p>Managing users within the portal — {users.length} active member{users.length !== 1 ? "s" : ""}</p>
                        </div>
                        <button
                            className="btn-add-user"
                            onClick={() => { setShowForm(!showForm); setFormError(""); }}
                        >
                            {showForm ? "✕ Cancel" : "+ Add User"}
                        </button>
                    </div>
                </div>

                {showForm && (
                    <div className="add-user-form-wrapper">
                        <div className="add-user-form">
                            <h3>Add New User</h3>
                            <form onSubmit={handleAddUser}>
                                <div className="form-group">
                                    <label>Full Name <span className="required">*</span></label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        placeholder="e.g. Ravi Sharma"
                                        required
                                    />
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Email <span className="required">*</span></label>
                                        <input
                                            type="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleInputChange}
                                            placeholder="user@example.com"
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Role</label>
                                        <select name="role" value={formData.role} onChange={handleInputChange}>
                                            {ROLE_OPTIONS.map(r => (
                                                <option key={r} value={r}>{r}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                {formError && <p className="form-error">{formError}</p>}
                                <div className="form-actions">
                                    <button type="button" className="btn-cancel" onClick={() => { setShowForm(false); setFormError(""); }}>
                                        Cancel
                                    </button>
                                    <button type="submit" className="btn-submit-ticket">
                                        Add User
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                <div className="com-user">
                    {users.length === 0 && (
                        <div className="no-users-msg">
                            <p>No users found. Click "+ Add User" to get started.</p>
                        </div>
                    )}
                    {users.map((user, index) => (
                        <div className="user-card" key={index}>
                            <div className="user-card-left">
                                <div className="user-avatar">{getRoleInitial(user.name)}</div>
                                <div className="user-info">
                                    <h3>{user.name}</h3>
                                    <p className="user-role-badge">{user.role}</p>
                                    <p className="user-email">✉ {user.email}</p>
                                </div>
                            </div>
                            <div className="user-card-actions">
                                {confirmDelete === index ? (
                                    <div className="confirm-delete">
                                        <span>Remove user?</span>
                                        <button className="btn-confirm-delete" onClick={() => handleDeleteUser(index)}>Yes, Remove</button>
                                        <button className="btn-cancel-delete" onClick={() => setConfirmDelete(null)}>Cancel</button>
                                    </div>
                                ) : (
                                    <button
                                        className="btn-delete-user"
                                        onClick={() => setConfirmDelete(index)}
                                        title="Remove User"
                                    >
                                        🗑 Remove
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>


            </div>
        </>
    );

}
export default UserMngt;
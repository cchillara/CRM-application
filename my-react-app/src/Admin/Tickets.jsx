import React, { useState } from "react";
import { NavLink, Route, Routes, useNavigate } from "react-router-dom";
import "./Client.css";
import {
    CLIENT_COMPANY_DETAILS,
    CLIENT_COMPANY_CONTRACTS,
    CLIENT_COMPANY_FINANCE,
    CLIENT_COMPANY_TICKETS
} from "./ClientData";

function Ticket (){
    const company = CLIENT_COMPANY_DETAILS();
    const contracts = CLIENT_COMPANY_CONTRACTS();
    const finance = CLIENT_COMPANY_FINANCE();
    const initialTickets = CLIENT_COMPANY_TICKETS();

    const [tickets, setTickets] = useState(initialTickets);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        category: "Technical Issue",
        priority: "Medium",
        description: "",
    });

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!formData.name.trim()) return;

        const newTicket = {
            name: formData.name,
            TNO: "#TICK" + Math.floor(1000 + Math.random() * 9000),
            CreatedDate: new Date().toLocaleDateString("en-GB").replace(/\//g, "-"),
            Status: "Open",
            category: formData.category,
            priority: formData.priority,
            description: formData.description,
        };

        setTickets([newTicket, ...tickets]);
        setFormData({ name: "", category: "Technical Issue", priority: "Medium", description: "" });
        setShowForm(false);
    };

    const getStatusColor = (status) => {
        if (status === "Resolved") return "ticket-status resolved";
        if (status === "Open") return "ticket-status open";
        return "ticket-status pending";
    };

    const getPriorityBadge = (priority) => {
        if (!priority) return null;
        return <span className={`priority-badge priority-${priority.toLowerCase()}`}>{priority}</span>;
    };

    return (
        <>
        <div className="tickets-div">
            <div className="tickets-heading">
                <div className="tickets-heading-left">
                    <h2>Support Tickets</h2>
                    <p>Support tickets raised with Shnoor — track and manage your requests</p>
                </div>
                <button
                    className="btn-create-ticket"
                    onClick={() => setShowForm(!showForm)}
                >
                    {showForm ? "✕ Cancel" : "+ Create Support Ticket"}
                </button>
            </div>

            {showForm && (
                <div className="create-ticket-form-wrapper">
                    <div className="create-ticket-form">
                        <h3>New Support Ticket</h3>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label>Issue Title <span className="required">*</span></label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    placeholder="Brief description of the issue"
                                    required
                                />
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Category</label>
                                    <select name="category" value={formData.category} onChange={handleInputChange}>
                                        <option>Technical Issue</option>
                                        <option>Billing</option>
                                        <option>Access & Permissions</option>
                                        <option>Feature Request</option>
                                        <option>Other</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Priority</label>
                                    <select name="priority" value={formData.priority} onChange={handleInputChange}>
                                        <option>Low</option>
                                        <option>Medium</option>
                                        <option>High</option>
                                        <option>Critical</option>
                                    </select>
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Description</label>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleInputChange}
                                    placeholder="Provide more details about the issue..."
                                    rows={4}
                                />
                            </div>
                            <div className="form-actions">
                                <button type="button" className="btn-cancel" onClick={() => setShowForm(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn-submit-ticket">
                                    Submit Ticket
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div className="tickets-summary-bar">
                <span className="summary-item"><strong>{tickets.length}</strong> Total</span>
                <span className="summary-item open-count"><strong>{tickets.filter(t => t.Status === "Open").length}</strong> Open</span>
                <span className="summary-item pending-count"><strong>{tickets.filter(t => t.Status === "Pending").length}</strong> Pending</span>
                <span className="summary-item resolved-count"><strong>{tickets.filter(t => t.Status === "Resolved").length}</strong> Resolved</span>
            </div>

            <div className="ticks-div">
                {tickets.map((tick, index) => (
                    <div className="tick-div" key={index}>
                        <div className="tick-header">
                            <h3>{tick.name}</h3>
                            <div className="tick-badges">
                                {getPriorityBadge(tick.priority)}
                                <span className={getStatusColor(tick.Status)}>{tick.Status}</span>
                            </div>
                        </div>
                        <div className="tick-meta">
                            <span className="tick-meta-item">🎫 {tick.TNO}</span>
                            <span className="tick-meta-item">📅 Created : {tick.CreatedDate}</span>
                            {tick.category && <span className="tick-meta-item">🏷 {tick.category}</span>}
                        </div>
                        {tick.description && (
                            <p className="tick-description">{tick.description}</p>
                        )}
                    </div>
                ))}
            </div>

        </div>
        </>
    );
}

export default Ticket;
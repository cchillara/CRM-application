import React, { useState } from "react";
import { NavLink, Route, Routes, useNavigate } from "react-router-dom";
import "./Client.css";
import {
    CLIENT_COMPANY_DETAILS,
    CLIENT_COMPANY_CONTRACTS,
    CLIENT_COMPANY_FINANCE,
    CLIENT_COMPANY_TICKETS
} from "./ClientData";

// Sample invoice data tied to contracts
const SAMPLE_INVOICES = [
    { id: "INV-2026-001", contract: "Agent Integration", amount: 12300, date: "01-04-2026", due: "01-05-2026", status: "Paid" },
    { id: "INV-2026-002", contract: "Software Update", amount: 45000, date: "03-03-2026", due: "03-04-2026", status: "Paid" },
    { id: "INV-2025-003", contract: "Software Maintenance", amount: 21260, date: "07-03-2025", due: "07-04-2025", status: "Paid" },
    { id: "INV-2026-004", contract: "Application Building", amount: 32100, date: "03-10-2026", due: "03-11-2026", status: "Pending" },
    { id: "INV-2020-005", contract: "Gaming Application Review", amount: 48000, date: "07-03-2020", due: "07-04-2020", status: "Paid" },
];

function Bill (){
    const company = CLIENT_COMPANY_DETAILS();
    const contracts = CLIENT_COMPANY_CONTRACTS();
    const finance = CLIENT_COMPANY_FINANCE();
    const tickets = CLIENT_COMPANY_TICKETS();

    const [activeTab, setActiveTab] = useState("overview");

    const totalValue = contracts.reduce((sum, c) => sum + c.contractValue, 0);
    const paidAmount = SAMPLE_INVOICES.filter(i => i.status === "Paid").reduce((sum, i) => sum + i.amount, 0);
    const pendingAmount = SAMPLE_INVOICES.filter(i => i.status === "Pending").reduce((sum, i) => sum + i.amount, 0);

    const getInvoiceStatusClass = (status) => {
        if (status === "Paid") return "invoice-status paid";
        if (status === "Pending") return "invoice-status invoice-pending";
        return "invoice-status";
    };

    return (
        <>
        <div className="billing-div">
            <div className="bill-heading">
                <div>
                    <h2>Billing &amp; Finance</h2>
                    <p>Managing financial accounts and invoices with Shnoor</p>
                </div>
            </div>

            {/* Financial Summary Cards */}
            <div className="billing-summary-row">
                <div className="billing-summary-card">
                    <p className="billing-card-label">Total Contract Value</p>
                    <h2 className="billing-card-amount">${totalValue.toLocaleString()}</h2>
                    <p className="billing-card-sub">{contracts.length} contracts</p>
                </div>
                <div className="billing-summary-card paid-card">
                    <p className="billing-card-label">Amount Paid</p>
                    <h2 className="billing-card-amount">${paidAmount.toLocaleString()}</h2>
                    <p className="billing-card-sub">{SAMPLE_INVOICES.filter(i => i.status === "Paid").length} invoices cleared</p>
                </div>
                <div className="billing-summary-card pending-card">
                    <p className="billing-card-label">Pending Payment</p>
                    <h2 className="billing-card-amount">${pendingAmount.toLocaleString()}</h2>
                    <p className="billing-card-sub">{SAMPLE_INVOICES.filter(i => i.status === "Pending").length} invoices due</p>
                </div>
                <div className="billing-summary-card">
                    <p className="billing-card-label">Billing Cycle</p>
                    <h2 className="billing-card-cycle">{finance.billingCycle}</h2>
                    <p className="billing-card-sub">Current cycle</p>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="billing-tabs">
                <button
                    className={`billing-tab ${activeTab === "overview" ? "tab-active" : ""}`}
                    onClick={() => setActiveTab("overview")}
                >
                    Billing Info
                </button>
                <button
                    className={`billing-tab ${activeTab === "invoices" ? "tab-active" : ""}`}
                    onClick={() => setActiveTab("invoices")}
                >
                    Invoices
                </button>
                <button
                    className={`billing-tab ${activeTab === "contracts" ? "tab-active" : ""}`}
                    onClick={() => setActiveTab("contracts")}
                >
                    Contract Breakdown
                </button>
            </div>

            {/* Tab Content */}
            {activeTab === "overview" && (
                <div className="bill-details">
                    <h3>{company.name} — Billing Information</h3>
                    <div className="bill-inn-details">
                        <div className="bill-info-grid">
                            <div className="bill-info-item">
                                <span className="bill-info-label">Billing Email</span>
                                <span className="bill-info-value">{finance.biilingMail}</span>
                            </div>
                            <div className="bill-info-item">
                                <span className="bill-info-label">Contact Name</span>
                                <span className="bill-info-value">{finance.billingPerson}</span>
                            </div>
                            <div className="bill-info-item">
                                <span className="bill-info-label">Billing Cycle</span>
                                <span className="bill-info-value">{finance.billingCycle}</span>
                            </div>
                            <div className="bill-info-item">
                                <span className="bill-info-label">Billing Contact</span>
                                <span className="bill-info-value">{finance.contact}</span>
                            </div>
                            <div className="bill-info-item">
                                <span className="bill-info-label">Currency</span>
                                <span className="bill-info-value">{finance.currency} (USD)</span>
                            </div>
                            <div className="bill-info-item">
                                <span className="bill-info-label">GSTIN</span>
                                <span className="bill-info-value">{finance.GSTIN}</span>
                            </div>
                            <div className="bill-info-item">
                                <span className="bill-info-label">Country</span>
                                <span className="bill-info-value">{finance.country}</span>
                            </div>
                            <div className="bill-info-item">
                                <span className="bill-info-label">State</span>
                                <span className="bill-info-value">{finance.state}</span>
                            </div>
                            <div className="bill-info-item">
                                <span className="bill-info-label">Pincode</span>
                                <span className="bill-info-value">{finance.pincode}</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === "invoices" && (
                <div className="bill-details">
                    <h3>Invoice History</h3>
                    <div className="invoice-table-wrapper">
                        <table className="invoice-table">
                            <thead>
                                <tr>
                                    <th>Invoice ID</th>
                                    <th>Contract</th>
                                    <th>Amount</th>
                                    <th>Invoice Date</th>
                                    <th>Due Date</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {SAMPLE_INVOICES.map((inv, i) => (
                                    <tr key={i}>
                                        <td className="invoice-id">{inv.id}</td>
                                        <td>{inv.contract}</td>
                                        <td className="invoice-amount">${inv.amount.toLocaleString()}</td>
                                        <td>{inv.date}</td>
                                        <td>{inv.due}</td>
                                        <td><span className={getInvoiceStatusClass(inv.status)}>{inv.status}</span></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {activeTab === "contracts" && (
                <div className="bill-details">
                    <h3>Contract Value Breakdown</h3>
                    {contracts.map((contract, i) => {
                        const percent = Math.round((contract.contractValue / totalValue) * 100);
                        return (
                            <div className="contract-breakdown-item" key={i}>
                                <div className="contract-breakdown-header">
                                    <span className="contract-breakdown-name">{contract.contractType}</span>
                                    <span className="contract-breakdown-value">${contract.contractValue.toLocaleString()} ({percent}%)</span>
                                </div>
                                <div className="progress-bar-wrapper">
                                    <div className="progress-bar-fill" style={{ width: `${percent}%` }}></div>
                                </div>
                                <p className="contract-breakdown-meta">
                                    {contract.contractId} · {contract.startDate} — {contract.endDate} · Manager: {contract.accountManager}
                                </p>
                            </div>
                        );
                    })}
                </div>
            )}

        </div>
        </>
    );
}

export default Bill;
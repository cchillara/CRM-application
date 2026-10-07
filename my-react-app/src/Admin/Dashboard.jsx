import React from "react";
import { NavLink, Route, Routes, useNavigate } from "react-router-dom";
import "./Client.css";
import {
    CLIENT_COMPANY_DETAILS,
    CLIENT_COMPANY_CONTRACTS,
    CLIENT_COMPANY_FINANCE,
    CLIENT_COMPANY_TICKETS
} from "./ClientData";

// Helper: parse a date string "DD-MM-YYYY" into a JS Date
function parseDate(dateStr) {
    const [d, m, y] = dateStr.split("-");
    return new Date(`${y}-${m}-${d}`);
}

// Calculate how far along a contract is (0 - 100)
function getContractProgress(startDate, endDate) {
    const start = parseDate(startDate);
    const end = parseDate(endDate);
    const now = new Date();
    if (now <= start) return 0;
    if (now >= end) return 100;
    const total = end - start;
    const elapsed = now - start;
    return Math.round((elapsed / total) * 100);
}


function Dashbrd() {
    const navigate = useNavigate();
    const company = CLIENT_COMPANY_DETAILS();
    const contracts = CLIENT_COMPANY_CONTRACTS();
    const finance = CLIENT_COMPANY_FINANCE();
    const tickets = CLIENT_COMPANY_TICKETS();

    const totalamount = contracts.reduce((total, contract) => total += contract.contractValue, 0);
    const activeContracts = contracts.filter(c => c.status === "Active");
    const openTickets = tickets.filter(t => t.Status === "Pending" || t.Status === "Open");

    return (
        <>

            {/* Dashboard */}

            <section className="client-dashboard">
                <nav className="dash-nav">
                    <h2>{company.name}</h2>
                    <p> Client Admin Portal </p>
                </nav>

                <div className="dash-content">
                    <div className="dash-sub-content">
                        <h3> Active Users</h3>
                        <h2> {company.users.length} </h2>
                        <p className="dash-sub-label">Team members</p>
                    </div>
                    <div className="dash-sub-content">
                        <h3>Active Contracts</h3>
                        <h2> {activeContracts.length} </h2>
                        <p className="dash-sub-label">of {contracts.length} total</p>
                    </div>
                    <div className="dash-sub-content">
                        <h3>Support Tickets</h3>
                        <h2> {tickets.length} </h2>
                        <p className="dash-sub-label">{openTickets.length} open</p>
                    </div>
                    <div className="dash-sub-content">
                        <h3> Total Contract Value</h3>
                        <h2> $ {totalamount.toLocaleString()} </h2>
                        <p className="dash-sub-label">All contracts</p>
                    </div>
                </div>

                <div className="client-project-ticket">
                    <div className="client-projects">
                        <div className="project-holders-heading">
                            <h3> Active Contracts </h3>
                            <NavLink to="/client-admin/contracts">
                                <button> View All</button>
                            </NavLink>
                        </div>
                        <div className="project-holders">
                            <p>Delivery and completion tracked by Shnoor </p>

                        </div>

                        {contracts.map((contract, index) => {
                            const progress = getContractProgress(contract.startDate, contract.endDate);
                            return (
                                <div className="project-holders contract-progress-card" key={index}>
                                    <h4> {contract.contractType} </h4>
                                    <div className="progress-bar-wrapper">
                                        <div
                                            className="progress-bar-fill"
                                            style={{ width: `${progress}%` }}
                                        ></div>
                                    </div>
                                    <p className="progress-label">{progress}% complete</p>
                                </div>
                            );
                        })}

                    </div>

                    <div className="client-tickets">
                        <div className="client-tickets-heading">
                            <h3> Recent Support Tickets</h3>
                            <NavLink to="/client-admin/tickets">
                                <button> View All</button>
                            </NavLink>
                        </div>
                        <div className="project-tickets">
                            <p> Track support tickets with Shnoor </p>
                        </div>

                        {tickets.map((ticket, index) => (
                            <div className="project-tickets" key={index}>
                                <br>
                                </br>
                                <h4>  {ticket.name}</h4>
                                <p> {ticket.TNO} </p>
                            </div>
                        ))}

                    </div>
                </div>


            </section>

        </>
    );


}
export default Dashbrd;
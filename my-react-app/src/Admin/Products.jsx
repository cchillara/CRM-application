import React from "react";
import { NavLink, Route, Routes, useNavigate } from "react-router-dom";
import "./Client.css";
import {
    CLIENT_COMPANY_DETAILS,
    CLIENT_COMPANY_CONTRACTS,
    CLIENT_COMPANY_FINANCE,
    CLIENT_COMPANY_TICKETS
} from "./ClientData";
import Menu from "./SideMenu";

function Product (){
    const company = CLIENT_COMPANY_DETAILS();
        const contracts = CLIENT_COMPANY_CONTRACTS();
        const finance = CLIENT_COMPANY_FINANCE();
        const tickets = CLIENT_COMPANY_TICKETS();
    return (
        <>
        <div className="contr-details">
            <div className="contr-heading">
                <h2> Active Contracts</h2>
                <p> Contracts Signed with Shnoor </p>
            </div>
            <div className="contracts">
                {contracts.map((contract) => (
                <div className="contract">
                    <h2>{contract.contractType}</h2>
                    <br>
                    </br>
                    <p> Contract ID : {contract.contractId}</p>
                    <p> Organization : {contract.customer}</p>
                    <p> Start Date : {contract.startDate}</p>
                    <p> End Date : {contract.endDate}</p>
                    <p> Contract Value : {contract.contractValue}</p>
                    <p> Status :  {contract.status}</p>
                    <p> Billing Cycle : {contract.billingCycle}</p>
                    <p> Account Manager : {contract.accountManager}</p>
                </div>
                
            ))}
            </div>
            
           

        </div>
        </>
    );
}

export default Product;
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


function Orgztion() {
    // const navigate = useNavigate();
    const company = CLIENT_COMPANY_DETAILS();
    const contracts = CLIENT_COMPANY_CONTRACTS();
    const finance = CLIENT_COMPANY_FINANCE();
    const tickets = CLIENT_COMPANY_TICKETS();
    return (
        <>
            <div className="org-content">
                <div className="orgn-info">
                    <h2> {company.name}</h2>
                    {/* <p> {company.id}</p> */}
                    <p> {company.service}</p>
                </div>

                <div className="ord-address">
                    <h2> Company Address</h2>
                    <br>
                    </br>
                    <p> {company.address}</p>
                </div>
                <div className="org-prim-contact">
                    <h2> Primary Contact</h2>
                    <br></br>
                    <p> {company.PrimaryContact}</p>
                </div>
                <div className="org-comp-contact">
                    <h2> Company Contact</h2>
                    <br></br>
                    <p> {company.CompanyContact}</p>
                </div>
                <div className="org-para">
                    <p> For More Information go to {company.website}</p>
                </div>

            </div>
        </>
    );
}

export default Orgztion;
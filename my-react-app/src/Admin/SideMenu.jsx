import React from "react";
import { NavLink, Route, Routes, useNavigate } from "react-router-dom";
import "./Client.css";
import {
    CLIENT_COMPANY_DETAILS,
    CLIENT_COMPANY_CONTRACTS,
    CLIENT_COMPANY_FINANCE,
    CLIENT_COMPANY_TICKETS
} from "./ClientData";

function Menu () {
    const navigate = useNavigate();
    const company = CLIENT_COMPANY_DETAILS();
    const contracts = CLIENT_COMPANY_CONTRACTS();
    const finance = CLIENT_COMPANY_FINANCE();
    const tickets = CLIENT_COMPANY_TICKETS();

    const getRoleInitial = (name) => name ? name.charAt(0).toUpperCase() : "S";

    const menuItems = [
        {
            name: "Dashboard",
            path: "/client-admin",
            icon: "▣",
            end: true,
        },
        {
            name: "Organization",
            path: "/client-admin/organization",
            icon: "🏢",
        },
        {
            name: "User Management",
            path: "/client-admin/users",
            icon: "👥",
        },
        {
            name: "Contracts",
            path: "/client-admin/contracts",
            icon: "📦",
        },
        {
            name: "Support Tickets",
            path: "/client-admin/tickets",
            icon: "🎫",
        },
        {
            name: "Billing & Finance",
            path: "/client-admin/finance",
            icon: "💼",
        },

    ];


    
    const logout = () =>{
        navigate("/login");
    };

    
    return (
        <>
            {/* Side Menu */}
                <aside className="client-sidebar">
                    <div className = "side-header">
                        {/* <h2 className="user-avatar"> {getRoleInitial("S")}</h2> */}
                        <h2> SHNOOR </h2>
                        {/* <p>Client Admin </p> */}
                    </div>
                    
                        
                  
                    <nav className = "side-menu">
                        {menuItems.map((item) => (
                            <NavLink className = "navlink" key={item.path} to={item.path}> 
                             {/* // each item should have its unique key, so we use path as key */}
                                {item.icon} {item.name}
                            </NavLink>
                        ))}
                    </nav>

                    <div className = "side-logout">
                        <button onClick = {logout}>
                            Log Out
                        </button>
                    </div>
                </aside>
        </>
    );
}

export default Menu;
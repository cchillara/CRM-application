import React from "react";
import "./Client.css";
import { Outlet } from "react-router-dom";
import Menu from "./SideMenu";

function Clientlayout() {
    return (
        <div className = "client-layout">

            {/* Fixed sidebar */}
            < Menu/>

            <main className="client-content">
                <Outlet />
            </main>

        </div>
    );
}
export default Clientlayout;
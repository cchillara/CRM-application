import React from "react";
import { NavLink, Route, Routes, useNavigate } from "react-router-dom";
import "./Client.css";
import Clientlayout from "./ClientLayout";
import Orgztion from "./Organization";
import Dashbrd from "./Dashboard";
import Product from "./Products";
import UserMngt from "./UserManagement";
import Ticket from "./Tickets";
import Bill from "./Billing";

function ClientAdmin() {

    return (
        
      <Routes>
        
        <Route path="/" element={<Clientlayout />}>

            <Route index element={<Dashbrd />} />

            <Route path="organization" element={<Orgztion />} />

            <Route path="users" element={<UserMngt />} />

            <Route path="contracts" element={<Product />} />

            <Route path="tickets" element={<Ticket />} />

            <Route path="finance" element={<Bill />} />

          </Route>
      </Routes>

    );

}

export default ClientAdmin;
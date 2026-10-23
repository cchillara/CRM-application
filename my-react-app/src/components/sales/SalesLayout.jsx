import {Outlet} from "react-router-dom" ;
import Sidebar from "./Sidebar";
import { SalesDataProvider } from "./SalesDataContext.jsx";
import "./SalesLayout.css";

function SalesLayout({ children }) {
  return (
    <SalesDataProvider>
      <div className="sales-layout">
        <Sidebar />

        <main className="sales-layout-content">
          {children || <Outlet />}
        </main>
      </div>
    </SalesDataProvider>
  );
}

export default SalesLayout;

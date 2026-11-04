import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";
export default function Layout(){return <div className="app"><Sidebar/><div className="main"><Header/><main className="content"><Outlet/></main></div></div>}

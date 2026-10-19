import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";
import { usePlatform } from "../context/PlatformContext";

export default function Layout() {
  const { apiError, apiLoading, refreshData } = usePlatform();
  return (
    <div className="app">
      <Sidebar />
      <div className="main">
        <Header />
        <main className="content">
          {apiLoading && <div className="form-note">Connecting to Super Admin API…</div>}
          {apiError && (
            <div role="alert" className="form-note" style={{ borderColor: "#d14343", color: "#a12626", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
              <span>Super Admin API: {apiError}</span>
              <button className="secondary-button" disabled={apiLoading} onClick={refreshData}>
                {apiLoading ? "Retrying…" : "Retry"}
              </button>
            </div>
          )}
          <Outlet />
        </main>
      </div>
    </div>
  );
}

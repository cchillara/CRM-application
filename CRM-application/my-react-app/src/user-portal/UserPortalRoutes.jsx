import { PortalProvider } from "./context/PortalContext.jsx";
import PortalApp from "./App.jsx";
import ErrorBoundary from "./components/ErrorBoundary.jsx";
import "./styles.css";

export default function UserPortalRoutes() {
  return <ErrorBoundary><PortalProvider><PortalApp /></PortalProvider></ErrorBoundary>;
}

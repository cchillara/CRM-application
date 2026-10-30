
import { useState, useEffect } from "react";
import { auth } from "../../firebase.js";
import { onAuthStateChanged } from "firebase/auth";
import PageHeader from "../../components/common/PageHeader.jsx";
import DataTable from "../../components/common/DataTable.jsx";
import "./SalesNotifications.css";

const API_BASE_URL = (import.meta.env.VITE_API_URL || "http://localhost:5000")
  .replace(/\/api\/v1.*$/, "")
  .replace(/\/$/, "");
const SALES_API_URL = `${API_BASE_URL}/api/v1/sales`;

function formatDateLabel(isoString) {
  if (!isoString) return "";
  const date = new Date(isoString);
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",

  });
}

function SalesNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchNotifications = async () => {
    setLoading(true);
    setError("");
    try {
      const idToken = await auth.currentUser.getIdToken();
      const response = await fetch(`${SALES_API_URL}/notifications`, {
        headers: { Authorization: `Bearer ${idToken}` },
      });
      if (!response.ok) throw new Error(`Failed to load notifications (${response.status})`);
      const json = await response.json();
      setNotifications(json.data || []);
    } catch (err) {
      setError(err.message || "Failed to load notifications.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) fetchNotifications();
      else setLoading(false);
    });
    return unsubscribe;
  }, []);

  const markAsRead = async (notificationId) => {
    try {
      const idToken = await auth.currentUser.getIdToken();
      await fetch(`${SALES_API_URL}/notifications/${notificationId}/read`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${idToken}` },
      });
      setNotifications((current) =>
        current.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n))
      );
    } catch {
    }
  };

  const markAllAsRead = async () => {
    try {
      const idToken = await auth.currentUser.getIdToken();
      await fetch(`${SALES_API_URL}/notifications/read-all`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${idToken}` },
      });
      setNotifications((current) => current.map((n) => ({ ...n, isRead: true })));
    } catch {
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="sales-notifications-page">
      <PageHeader title="Notifications" description="Recent updates and reminders for your sales work." />

      {/* STEP 8: Show loading / error states */}
      {loading && <p className="sales-form-loading">Loading notifications…</p>}
      {error && <p className="sales-form-error" role="alert">{error}</p>}

      {!loading && !error && (
        <section className="sales-notifications-card" aria-label="Notifications">
          {/* Mark all as read button — only shown when there are unread notifications */}
          {unreadCount > 0 && (
            <div style={{ display: "flex", justifyContent: "flex-end", padding: "0 0 12px" }}>
              <button
                type="button"
                className="sales-profile-edit"
                onClick={markAllAsRead}
              >
                Mark all as read ({unreadCount})
              </button>
            </div>
          )}

          <DataTable headers={["Notification", "Date"]} tableClassName="sales-notifications-table">
            {notifications.length === 0 && (
              <tr><td colSpan={2} style={{ textAlign: "center", color: "#718096" }}>No notifications yet.</td></tr>
            )}
            {notifications.map((notification) => (
              <tr
                key={notification.id}
                style={{ opacity: notification.isRead ? 0.6 : 1, cursor: notification.isRead ? "default" : "pointer" }}
                onClick={() => !notification.isRead && markAsRead(notification.id)}
                title={notification.isRead ? "" : "Click to mark as read"}
              >
                <td>
                  <div className="sales-notifications-copy">
                    {/* Show unread dot for unread notifications */}
                    <strong>
                      {!notification.isRead && (
                        <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: "#3978c5", marginRight: 6, verticalAlign: "middle" }} />
                      )}
                      {notification.title}
                    </strong>
                    <span>{notification.message}</span>
                  </div>
                </td>
                <td>
                  <time dateTime={notification.createdAt}>
                    {formatDateLabel(notification.createdAt)}
                  </time>
                </td>
              </tr>
            ))}
          </DataTable>
        </section>
      )}
    </div>
  );
}

export default SalesNotifications;

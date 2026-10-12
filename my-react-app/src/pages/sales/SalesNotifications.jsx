import PageHeader from "../../components/common/PageHeader.jsx";
import DataTable from "../../components/common/DataTable.jsx";
import "./SalesNotifications.css";

const notifications = [
  { id: "notification-001", title: "New lead added", message: "A website inquiry was added to your leads.", dateTime: "2026-10-12T09:15:00", dateLabel: "Oct 12, 2026 · 9:15 AM" },
  { id: "notification-002", title: "Task due today", message: "Prepare the product overview for your customer discussion.", dateTime: "2026-10-12T08:30:00", dateLabel: "Oct 12, 2026 · 8:30 AM" },
  { id: "notification-003", title: "Meeting upcoming", message: "Your customer discovery meeting is scheduled for tomorrow.", dateTime: "2026-10-11T15:45:00", dateLabel: "Oct 11, 2026 · 3:45 PM" },
  { id: "notification-004", title: "Lead qualified", message: "The business systems evaluation lead moved to Qualified.", dateTime: "2026-10-10T13:20:00", dateLabel: "Oct 10, 2026 · 1:20 PM" },
  { id: "notification-005", title: "Follow-up reminder", message: "Follow up on the pricing options shared with your prospect.", dateTime: "2026-10-09T10:00:00", dateLabel: "Oct 9, 2026 · 10:00 AM" },
];

function SalesNotifications() {
  return (
    <div className="sales-notifications-page">
      <PageHeader title="Notifications" description="Recent updates and reminders for your sales work." />
      <section className="sales-notifications-card" aria-label="Notifications">
        <DataTable headers={["Notification", "Date"]} tableClassName="sales-notifications-table">
          {notifications.map((notification) => (
            <tr key={notification.id}>
              <td>
                <div className="sales-notifications-copy">
                  <strong>{notification.title}</strong>
                  <span>{notification.message}</span>
                </div>
              </td>
              <td><time dateTime={notification.dateTime}>{notification.dateLabel}</time></td>
            </tr>
          ))}
        </DataTable>
      </section>
    </div>
  );
}

export default SalesNotifications;

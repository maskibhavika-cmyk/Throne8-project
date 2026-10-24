
import { useCallback, useEffect, useState } from "react";
import "./Notifications.css";

const API = "http://localhost:5000/api/v1";

function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState("");

  const fetchNotifications = useCallback(async () => {
    try {
      setError("");

      const response = await fetch(`${API}/notifications`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Notifications load nahi hui.");
      }

      setNotifications(data.notifications || []);
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
  const loadNotifications = async () => {
    await fetchNotifications();
  };

  loadNotifications();
}, [fetchNotifications]);

  const markAsRead = async (notificationId) => {
    try {
      setUpdatingId(notificationId);
      setError("");

      const response = await fetch(
        `${API}/notifications/${notificationId}/read`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Notification update nahi hui.");
      }

      setNotifications((previous) =>
        previous.map((notification) =>
          notification._id === notificationId
            ? { ...notification, isRead: true }
            : notification
        )
      );
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setUpdatingId("");
    }
  };

  const unreadCount = notifications.filter(
    (notification) => !notification.isRead
  ).length;

  return (
    <main className="notifications-page">
      <div className="notifications-header">
        <div>
          <p className="notifications-eyebrow">THRONE8 UPDATES</p>
          <h1>Notifications</h1>
          <p className="notifications-subtitle">
            Apni bookings, payments aur refund updates yahan dekho.
          </p>
        </div>

        <div className="unread-summary">
          <span>{unreadCount}</span>
          <small>Unread</small>
        </div>
      </div>

      {error && <div className="notification-error">{error}</div>}

      {loading ? (
        <div className="notification-state">Loading notifications...</div>
      ) : notifications.length === 0 ? (
        <div className="notification-empty">
          <div className="empty-bell">🔔</div>
          <h2>You're all caught up!</h2>
          <p>Abhi koi notification nahi hai. New updates yahan dikhenge.</p>
          <button onClick={fetchNotifications}>Refresh</button>
        </div>
      ) : (
        <div className="notification-list">
          {notifications.map((notification) => (
            <article
              key={notification._id}
              className={`notification-card ${
                notification.isRead ? "is-read" : "is-unread"
              }`}
            >
              <div className="notification-icon">
                {notification.type === "PAYMENT_SUCCESS"
                  ? "💳"
                  : notification.type === "REFUND_UPDATE"
                  ? "↩️"
                  : notification.type === "PAYOUT_UPDATE"
                  ? "💰"
                  : notification.type.startsWith("BOOKING_")
                  ? "📅"
                  : "🔔"}
              </div>

              <div className="notification-content">
                <div className="notification-title-row">
                  <h3>{notification.title}</h3>
                  {!notification.isRead && (
                    <span className="unread-dot" title="Unread" />
                  )}
                </div>

                <p>{notification.message}</p>

                <small>
                  {notification.createdAt
                    ? new Date(notification.createdAt).toLocaleString()
                    : ""}
                </small>

                <div className="notification-actions">
                  {!notification.isRead && (
                    <button
                      onClick={() => markAsRead(notification._id)}
                      disabled={updatingId === notification._id}
                    >
                      {updatingId === notification._id
                        ? "Updating..."
                        : "Mark as Read"}
                    </button>
                  )}

                  {notification.link && (
                    <a href={notification.link}>View Details</a>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      <button
        className="notification-refresh"
        onClick={fetchNotifications}
        disabled={loading}
      >
        Refresh Notifications
      </button>
    </main>
  );
}

export default Notifications;

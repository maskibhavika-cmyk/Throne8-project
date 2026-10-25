import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./Notifications.css";

const API = "http://localhost:5000/api/v1";

const getNotificationIcon = (type) => {
  const icons = {
    PAYMENT_SUCCESS: "💳",
    PAYMENT_FAILED: "⚠️",
    REFUND_UPDATE: "↩",
    PAYOUT_UPDATE: "₹",
    BOOKING_CONFIRMED: "📅",
    BOOKING_CANCELLED: "✕",
    BOOKING_COMPLETED: "✓",
    GENERAL: "✦",
  };

  return icons[type] || "✦";
};

const formatDate = (date) => {
  if (!date) return "Recently";

  const parsedDate = new Date(date);
  if (Number.isNaN(parsedDate.getTime())) return "Recently";

  return parsedDate.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

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
  const timer = setTimeout(() => {
    fetchNotifications();
  }, 0);

  return () => clearTimeout(timer);
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
      <div className="notifications-shell">
        <div className="notifications-breadcrumb">
          <span className="breadcrumb-dot" />
          WORKSPACE <span>/</span> NOTIFICATIONS
        </div>

        <section className="notifications-header">
          <div className="notifications-heading">
            <div className="notifications-eyebrow">
              <span className="eyebrow-line" />
              YOUR PERSONAL ACTIVITY CENTER
            </div>

            <h1>
              Stay in the <span>loop.</span>
            </h1>

            <p className="notifications-subtitle">
              All your mentorship, booking, payment and refund updates —
              together in one place.
            </p>
          </div>

          <div className="unread-summary">
            <div className="summary-top">
              <span className="summary-indicator" />
              INBOX STATUS
            </div>
            <div className="summary-number">{unreadCount}</div>
            <div className="summary-bottom">
              Unread notification{unreadCount === 1 ? "" : "s"}
            </div>
          </div>
        </section>

        <section className="notifications-toolbar">
          <div className="toolbar-title">
            <div className="toolbar-icon">✦</div>
            <div>
              <h2>Recent activity</h2>
              <p>Your latest account updates</p>
            </div>
          </div>

          <button
            className="notification-refresh"
            onClick={fetchNotifications}
            disabled={loading}
          >
            <span className={loading ? "refresh-symbol spinning" : "refresh-symbol"}>
              ↻
            </span>
            {loading ? "Refreshing..." : "Refresh inbox"}
          </button>
        </section>

        {error && (
          <div className="notification-error">
            <span>!</span>
            <p>{error}</p>
            <button onClick={fetchNotifications}>Try again</button>
          </div>
        )}

        {loading ? (
          <div className="notification-state">
            <div className="loading-spinner" />
            <h3>Loading your updates</h3>
            <p>Please wait while we fetch your notifications.</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="notification-empty">
            <div className="empty-art">
              <div className="empty-orbit orbit-one" />
              <div className="empty-orbit orbit-two" />
              <div className="empty-bell">♧</div>
              <span className="empty-spark spark-one">✦</span>
              <span className="empty-spark spark-two">✧</span>
            </div>

            <span className="empty-label">ALL CAUGHT UP</span>
            <h2>Peace and quiet. For now.</h2>
            <p>
              You don't have any notifications yet. When there's an update
              about your bookings, payments or refunds, you'll find it here.
            </p>

            <button
              className="empty-refresh"
              onClick={fetchNotifications}
              disabled={loading}
            >
              <span>↻</span> Check for updates
            </button>

            <div className="empty-footer">
              <span className="footer-check">✓</span>
              You're up to date
            </div>
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
                <div className={`notification-icon icon-${notification.type}`}>
                  {getNotificationIcon(notification.type)}
                </div>

                <div className="notification-content">
                  <div className="notification-title-row">
                    <h3>{notification.title || "THRONE8 Update"}</h3>

                    {!notification.isRead && (
                      <span className="unread-badge">
                        <span /> NEW
                      </span>
                    )}
                  </div>

                  <p>{notification.message}</p>

                  <div className="notification-meta">
                    <span className="meta-clock">◷</span>
                    {formatDate(notification.createdAt)}
                  </div>

                  <div className="notification-actions">
                    {!notification.isRead && (
                      <button
                        className="mark-read-button"
                        onClick={() => markAsRead(notification._id)}
                        disabled={updatingId === notification._id}
                      >
                        {updatingId === notification._id
                          ? "Updating..."
                          : "✓ Mark as read"}
                      </button>
                    )}

                    {notification.link && (
                      <Link
                        className="view-details-button"
                        to={notification.link}
                      >
                        View details <span>↗</span>
                      </Link>
                    )}
                  </div>
                </div>

                <div className="notification-card-status">
                  {notification.isRead ? (
                    <span className="read-status">Read</span>
                  ) : (
                    <span className="status-dot" />
                  )}
                </div>
              </article>
            ))}
          </div>
        )}

        <footer className="notifications-footer">
          <span>THRONE8 <span className="footer-separator">/</span> NOTIFICATIONS</span>
          <span>Every update, all in one place. <span className="footer-heart">✦</span></span>
        </footer>
      </div>
    </main>
  );
}

export default Notifications;
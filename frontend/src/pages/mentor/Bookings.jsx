
import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import "./Bookings.css";

const API = "http://localhost:5000/api/v1";

export default function Bookings() {
  const [bookings, setBookings] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [actionLoading, setActionLoading] = useState("");

  const getAuthHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  });

  const loadBookings = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const mentorId = user._id || user.id;

      const res = await axios.get(`${API}/bookings/mentor/${mentorId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setBookings(res.data.bookings || []);
      setError("");
    } catch (err) {
      setError(
        err.response?.data?.message || "Bookings load nahi hui."
      );
    } finally {
      setLoading(false);
    }
  };

  const completeBooking = async (bookingId) => {
    const confirmed = window.confirm(
      "Kya tum is booking ko completed mark karna chahte ho?"
    );
    if (!confirmed) return;

    try {
      setActionLoading(bookingId);
      setError("");
      await axios.patch(
        `${API}/bookings/${bookingId}/complete`,
        {},
        { headers: getAuthHeaders() }
      );
      alert("Booking completed successfully!");
      await loadBookings();
    } catch (err) {
      setError(
        err.response?.data?.message || "Booking complete nahi hui."
      );
    } finally {
      setActionLoading("");
    }
  };
useEffect(() => {
  const fetchBookings = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const mentorId = user._id || user.id;

      const res = await axios.get(`${API}/bookings/mentor/${mentorId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setBookings(res.data.bookings || []);
      setError("");
    } catch (err) {
      setError(
        err.response?.data?.message || "Bookings load nahi hui."
      );
    } finally {
      setLoading(false);
    }
  };

  fetchBookings();
}, []);
  const filteredBookings = useMemo(() => {
    return bookings.filter((booking) => {
      const query = search.toLowerCase();
      const matchesSearch = [
        booking._id || "",
        booking.status || "",
        booking.paymentStatus || "",
        booking.student?.name || "",
        booking.student?.email || "",
      ].some((value) =>
        String(value).toLowerCase().includes(query)
      );
      const matchesStatus =
        statusFilter === "ALL" || booking.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [bookings, search, statusFilter]);

  const formatAmount = (amount) =>
    `₹${((amount || 0) / 100).toLocaleString("en-IN")}`;

  const badgeClass = (status) => {
    const value = (status || "UNKNOWN").toLowerCase();
    return `mb-badge mb-${value.replace(/_/g, "-")}`;
  };

  const totalEarnings = bookings
    .filter((b) => b.paymentStatus === "PAID")
    .reduce((sum, b) => sum + (b.amountPaise || b.amount || 0), 0);

  const stats = [
    { label: "Total Bookings", value: bookings.length, icon: "▦" },
    {
      label: "Confirmed",
      value: bookings.filter((b) => b.status === "CONFIRMED").length,
      icon: "✓",
    },
    {
      label: "Completed",
      value: bookings.filter((b) => b.status === "COMPLETED").length,
      icon: "◆",
    },
    { label: "Total Earnings", value: formatAmount(totalEarnings), icon: "₹" },
  ];

  return (
    <div className="mb-page">
      <header className="mb-header">
        <div>
          <span className="mb-eyebrow">THRONE8 / MENTOR</span>
          <h1>My Bookings</h1>
          <p>Manage your mentorship sessions, track statuses and payments.</p>
        </div>
        <div className="mb-header-tag">MENTOR CONTROL CENTER</div>
      </header>

      <section className="mb-stats">
        {stats.map((stat) => (
          <article className="mb-stat-card" key={stat.label}>
            <div className="mb-stat-icon">{stat.icon}</div>
            <p>{stat.label}</p>
            <h2>{stat.value}</h2>
          </article>
        ))}
      </section>

      <section className="mb-panel">
        <div className="mb-panel-heading">
          <div>
            <h2 style={{ color: '#0f172a', fontSize: '20px', margin: '0 0 4px' }}>All Your Bookings</h2>
            <p>Review sessions assigned to you.</p>
          </div>
          <span className="mb-count">
            {filteredBookings.length} of {bookings.length} bookings
          </span>
        </div>

        <div className="mb-filters">
          <input
            type="search"
            placeholder="Search booking ID, student..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search bookings"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            aria-label="Filter booking status"
          >
            <option value="ALL">All Booking Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
            <option value="DISPUTED">Disputed</option>
          </select>
        </div>

        {loading && <div className="mb-message">Loading bookings...</div>}
        {!loading && error && <div className="mb-message mb-error">{error}</div>}

        {!loading && !error && (
          <div className="mb-table-wrap">
            <table className="mb-table">
              <thead>
                <tr>
                  <th>STUDENT</th>
                  <th>SESSION DATE</th>
                  <th>AMOUNT</th>
                  <th>BOOKING STATUS</th>
                  <th>PAYMENT STATUS</th>
                  <th>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {filteredBookings.map((booking) => {
                  const canComplete =
                    booking.status === "CONFIRMED" &&
                    booking.paymentStatus === "PAID" &&
                    booking.sessionDate &&
                    new Date(booking.sessionDate) <= new Date() &&
                    !booking.completedAt;

                  return (
                    <tr key={booking._id}>
                      <td>
                        <strong>{booking.student?.name || "N/A"}</strong>
                        <small>
                          {booking.student?.email || "Student details unavailable"}
                        </small>
                      </td>
                      <td>
                        {booking.sessionDate
                          ? new Date(booking.sessionDate).toLocaleDateString("en-IN", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })
                          : "N/A"}
                      </td>
                      <td className="mb-amount">
                        {formatAmount(booking.amountPaise || booking.amount)}
                      </td>
                      <td>
                        <span className={badgeClass(booking.status)}>
                          {booking.status || "UNKNOWN"}
                        </span>
                      </td>
                      <td>
                        <span className={badgeClass(booking.paymentStatus)}>
                          {booking.paymentStatus || "UNKNOWN"}
                        </span>
                      </td>
                      <td>
                        {canComplete ? (
                          <button
                            type="button"
                            className="mb-complete-btn"
                            disabled={actionLoading === booking._id}
                            onClick={() => completeBooking(booking._id)}
                          >
                            {actionLoading === booking._id
                              ? "Completing..."
                              : "Complete Booking"}
                          </button>
                        ) : (
                          <span className="mb-muted">
                            {booking.status === "COMPLETED" ? "Completed" : "—"}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}

                {filteredBookings.length === 0 && (
                  <tr>
                    <td colSpan={6} className="mb-empty">
                      No bookings match your search or filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <footer className="mb-footer">
        THRONE8 Mentor Panel <span>•</span> Bookings Overview
      </footer>
    </div>
  );
}
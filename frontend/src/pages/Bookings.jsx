
import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import "./Bookings.css";

function Bookings() {
  const [bookings, setBookings] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");

  useEffect(() => {
    const token = localStorage.getItem("token");

    axios
      .get("http://localhost:5000/api/v1/admin/bookings", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        setBookings(
          Array.isArray(res.data.bookings) ? res.data.bookings : []
        );
      })
      .catch((err) => {
        setError(
          err.response?.data?.message || "Bookings load nahi hui."
        );
      })
      .finally(() => setLoading(false));
  }, []);

  const filteredBookings = useMemo(() => {
    return bookings.filter((booking) => {
      const student = booking.student?.name || "";
      const mentor = booking.mentor?.name || "";
      const query = search.trim().toLowerCase();

      const matchesSearch =
        student.toLowerCase().includes(query) ||
        mentor.toLowerCase().includes(query);

      const matchesStatus =
        statusFilter === "all" ||
        (booking.status || "").toLowerCase() === statusFilter;

      const matchesPayment =
        paymentFilter === "all" ||
        (booking.paymentStatus || "").toLowerCase() === paymentFilter;

      return matchesSearch && matchesStatus && matchesPayment;
    });
  }, [bookings, search, statusFilter, paymentFilter]);

  const confirmedCount = bookings.filter(
    (b) => (b.status || "").toLowerCase() === "confirmed"
  ).length;

  const pendingCount = bookings.filter(
    (b) => (b.status || "").toLowerCase() === "pending"
  ).length;

  const paidCount = bookings.filter(
    (b) => (b.paymentStatus || "").toLowerCase() === "paid"
  ).length;

  const formatAmount = (amount) =>
    `₹${((amount || 0) / 100).toLocaleString("en-IN")}`;

  const formatDate = (date) => {
    if (!date) return "N/A";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) return "N/A";

    return parsedDate.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="bookings-page">
        <div className="bookings-state">Loading bookings...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bookings-page">
        <div className="bookings-error">
          <h2>Unable to load bookings</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bookings-page">
      <header className="bookings-header">
        <div>
          <span className="bookings-eyebrow">THRONE8 ADMIN PANEL</span>
          <h1>Booking Management</h1>
          <p>Manage and track all mentorship bookings.</p>
        </div>

        <div className="bookings-total">
          <span className="bookings-total-icon">▦</span>
          <div>
            <small>Total Bookings</small>
            <h2>{bookings.length}</h2>
          </div>
        </div>
      </header>

      <section className="booking-stats">
        <div className="booking-stat-card">
          <span className="booking-stat-icon">▦</span>
          <div>
            <p>Total Bookings</p>
            <h2>{bookings.length}</h2>
          </div>
        </div>

        <div className="booking-stat-card">
          <span className="booking-stat-icon confirmed-icon">✓</span>
          <div>
            <p>Confirmed</p>
            <h2>{confirmedCount}</h2>
          </div>
        </div>

        <div className="booking-stat-card">
          <span className="booking-stat-icon pending-icon">◷</span>
          <div>
            <p>Pending</p>
            <h2>{pendingCount}</h2>
          </div>
        </div>

        <div className="booking-stat-card">
          <span className="booking-stat-icon paid-icon">₹</span>
          <div>
            <p>Paid Payments</p>
            <h2>{paidCount}</h2>
          </div>
        </div>
      </section>

      <section className="bookings-panel">
        <div className="bookings-panel-heading">
          <div>
            <h2>All Bookings</h2>
            <p>View and filter mentorship session records.</p>
          </div>

          <span className="booking-record-count">
            {filteredBookings.length} records
          </span>
        </div>

        <div className="bookings-toolbar">
          <input
            type="search"
            className="bookings-search"
            placeholder="Search student or mentor..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <select
            className="bookings-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Booking Status</option>
            <option value="confirmed">Confirmed</option>
            <option value="pending">Pending</option>
            <option value="cancelled">Cancelled</option>
            <option value="completed">Completed</option>
          </select>

          <select
            className="bookings-filter"
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
          >
            <option value="all">All Payment Status</option>
            <option value="paid">Paid</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
          </select>
        </div>

        <div className="bookings-table-wrap">
          <table className="bookings-table">
            <thead>
              <tr>
                <th>STUDENT / MENTOR</th>
                <th>SESSION DATE</th>
                <th>AMOUNT</th>
                <th>BOOKING STATUS</th>
                <th>PAYMENT</th>
              </tr>
            </thead>

            <tbody>
              {filteredBookings.map((booking) => (
                <tr key={booking._id}>
                  <td>
                    <div className="booking-people">
                      <div className="booking-person">
                        <span className="booking-avatar">
                          {(booking.student?.name || "N").charAt(0).toUpperCase()}
                        </span>
                        <div>
                          <strong>{booking.student?.name || "N/A"}</strong>
                          <small>Student</small>
                        </div>
                      </div>

                      <div className="booking-mentor">
                        Mentor: {booking.mentor?.name || "N/A"}
                      </div>
                    </div>
                  </td>

                  <td>{formatDate(booking.sessionDate)}</td>

                  <td className="booking-amount">
                    {formatAmount(booking.amountPaise)}
                  </td>

                  <td>
                    <span
                      className={`booking-badge status-${(
                        booking.status || "unknown"
                      ).toLowerCase()}`}
                    >
                      {booking.status || "N/A"}
                    </span>
                  </td>

                  <td>
                    <span
                      className={`booking-badge payment-${(
                        booking.paymentStatus || "unknown"
                      ).toLowerCase()}`}
                    >
                      {booking.paymentStatus || "N/A"}
                    </span>
                  </td>
                </tr>
              ))}

              {filteredBookings.length === 0 && (
                <tr>
                  <td colSpan="5" className="bookings-empty">
                    No matching bookings found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="bookings-table-footer">
          Showing {filteredBookings.length} of {bookings.length} bookings
        </div>
      </section>
    </div>
  );
}

export default Bookings;

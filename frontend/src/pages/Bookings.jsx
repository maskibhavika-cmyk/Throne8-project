
import { useEffect, useState } from "react";
import axios from "axios";
import "./Bookings.css";

const API = "http://localhost:5000/api/v1";

export default function Bookings() {
  const [bookings, setBookings] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const timer = setTimeout(async () => {
      try {
        const token = localStorage.getItem("token");
        const user = JSON.parse(localStorage.getItem("user") || "{}");
        const mentorId = user._id || user.id;

        if (!token || !mentorId) {
          setError("Please login again to view your bookings.");
          return;
        }

        const res = await axios.get(
          `${API}/bookings/mentor/${mentorId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        setBookings(
          Array.isArray(res.data.bookings) ? res.data.bookings : []
        );
      } catch (err) {
        setError(
          err.response?.data?.message || "Unable to load bookings."
        );
      } finally {
        setLoading(false);
      }
    }, 0);

    return () => clearTimeout(timer);
  }, []);

  const filteredBookings = bookings.filter((booking) => {
    const query = search.toLowerCase();

    const matchesSearch = [
      booking._id,
      booking.student?.name,
      booking.student?.email,
    ].some((value) =>
      String(value || "").toLowerCase().includes(query)
    );

    const matchesStatus =
      statusFilter === "ALL" ||
      booking.status?.toUpperCase() === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const pending = bookings.filter(
    (b) => b.status?.toUpperCase() === "PENDING"
  ).length;

  const confirmed = bookings.filter(
    (b) => b.status?.toUpperCase() === "CONFIRMED"
  ).length;

  const completed = bookings.filter(
    (b) => b.status?.toUpperCase() === "COMPLETED"
  ).length;

  if (loading) {
    return (
      <div className="bookings-page">
        <div className="bookings-state">Loading bookings...</div>
      </div>
    );
  }

  return (
    <main className="bookings-page">
      <header className="bookings-header">
        <div>
          <span className="bookings-eyebrow">THRONE8 / MENTOR</span>
          <h1>My Bookings</h1>
          <p>Manage your mentoring sessions in one place.</p>
        </div>

        <div className="bookings-total">
          <span className="bookings-total-icon">▣</span>
          <div>
            <small>Total Bookings</small>
            <h2>{bookings.length}</h2>
          </div>
        </div>
      </header>

      {error && (
        <div className="bookings-error">
          {error}
        </div>
      )}

      <section className="booking-stats">
        <article className="booking-stat-card">
          <span className="stat-symbol">▣</span>
          <div>
            <p>Total Bookings</p>
            <h2>{bookings.length}</h2>
          </div>
        </article>

        <article className="booking-stat-card">
          <span className="stat-symbol pending-icon">◷</span>
          <div>
            <p>Pending</p>
            <h2>{pending}</h2>
          </div>
        </article>

        <article className="booking-stat-card">
          <span className="stat-symbol confirmed-icon">✓</span>
          <div>
            <p>Confirmed</p>
            <h2>{confirmed}</h2>
          </div>
        </article>

        <article className="booking-stat-card">
          <span className="stat-symbol completed-icon">★</span>
          <div>
            <p>Completed</p>
            <h2>{completed}</h2>
          </div>
        </article>
      </section>

      <section className="bookings-panel">
        <div className="bookings-panel-heading">
          <div>
            <h2>Booking Records</h2>
            <p>Review your latest student bookings.</p>
          </div>
          <span className="record-count">
            {filteredBookings.length} records
          </span>
        </div>

        <div className="bookings-toolbar">
          <input
            className="bookings-search"
            type="search"
            placeholder="Search by booking ID or student..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <select
            className="bookings-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="ALL">All statuses</option>
            <option value="PENDING">Pending</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>

        <div className="bookings-table-wrap">
          <table className="bookings-table">
            <thead>
              <tr>
                <th>BOOKING ID</th>
                <th>STUDENT</th>
                <th>BOOKING STATUS</th>
                <th>PAYMENT STATUS</th>
              </tr>
            </thead>

            <tbody>
              {filteredBookings.map((booking) => {
                const status =
                  booking.status?.toUpperCase() || "UNKNOWN";
                const payment =
                  booking.paymentStatus?.toUpperCase() || "UNKNOWN";

                return (
                  <tr key={booking._id}>
                    <td>
                      <span className="booking-id">
                        #{booking._id}
                      </span>
                    </td>

                    <td>
                      <div className="booking-person">
                        <div className="booking-avatar">
                          {(booking.student?.name || "S")
                            .charAt(0)
                            .toUpperCase()}
                        </div>
                        <div>
                          <strong>
                            {booking.student?.name || "Student"}
                          </strong>
                          <small>
                            {booking.student?.email || "Student account"}
                          </small>
                        </div>
                      </div>
                    </td>

                    <td>
                      <span
                        className={`booking-badge status-${status.toLowerCase()}`}
                      >
                        <span className="badge-dot"></span>
                        {status}
                      </span>
                    </td>

                    <td>
                      <span
                        className={`booking-badge payment-${payment.toLowerCase()}`}
                      >
                        <span className="badge-dot"></span>
                        {payment}
                      </span>
                    </td>
                  </tr>
                );
              })}

              {filteredBookings.length === 0 && (
                <tr>
                  <td colSpan="4" className="bookings-empty">
                    No matching bookings found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <footer className="bookings-table-footer">
          Showing {filteredBookings.length} of {bookings.length} bookings
        </footer>
      </section>
    </main>
  );
}

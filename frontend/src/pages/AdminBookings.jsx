
import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import "./AdminBookings.css";

function AdminBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [paymentFilter, setPaymentFilter] = useState("ALL");
  const [actionLoading, setActionLoading] = useState("");

  const getAuthHeaders = () => ({
    Authorization: "Bearer " + localStorage.getItem("token"),
  });

  const fetchBookings = async () => {
    const res = await axios.get(
      "http://localhost:5000/api/v1/admin/bookings",
      { headers: getAuthHeaders() }
    );

    setBookings(
      Array.isArray(res.data.bookings) ? res.data.bookings : []
    );
  };

  useEffect(() => {
  let ignore = false;

  const loadBookings = async () => {
    try {
      const res = await axios.get(
        "http://localhost:5000/api/v1/admin/bookings",
        { headers: getAuthHeaders() }
      );

      if (!ignore) {
        setBookings(
          Array.isArray(res.data.bookings) ? res.data.bookings : []
        );
      }
    } catch (err) {
      if (!ignore) {
        setError(
          err.response?.data?.message || "Unable to load bookings."
        );
      }
    } finally {
      if (!ignore) {
        setLoading(false);
      }
    }
  };

  loadBookings();

  return () => {
    ignore = true;
  };
}, []);
  const handleCompleteBooking = async (bookingId) => {
    const confirmed = window.confirm(
      "Kya tum sach mein is session ko completed mark karna chahte ho?"
    );

    if (!confirmed) return;

    try {
      setActionLoading(bookingId);
      setError("");

      await axios.patch(
        `http://localhost:5000/api/v1/bookings/${bookingId}/complete`,
        {},
        { headers: getAuthHeaders() }
      );

      await fetchBookings();

      window.alert("Booking successfully completed!");
    } catch (err) {
      window.alert(
        err.response?.data?.message || "Booking complete nahi hui."
      );
    } finally {
      setActionLoading("");
    }
  };

  const filteredBookings = useMemo(() => {
    return bookings.filter((booking) => {
      const student = booking.student?.name || "";
      const mentor = booking.mentor?.name || "";
      const query = search.toLowerCase();

      const matchesSearch = [
        student,
        mentor,
        booking._id || "",
        booking.status || "",
        booking.paymentStatus || "",
      ].some((value) =>
        String(value).toLowerCase().includes(query)
      );

      const matchesStatus =
        statusFilter === "ALL" || booking.status === statusFilter;

      const matchesPayment =
        paymentFilter === "ALL" ||
        booking.paymentStatus === paymentFilter;

      return matchesSearch && matchesStatus && matchesPayment;
    });
  }, [bookings, search, statusFilter, paymentFilter]);

  const formatAmount = (amount) =>
    `₹${((amount || 0) / 100).toLocaleString("en-IN")}`;

  const badgeClass = (status) => {
    const value = (status || "UNKNOWN").toLowerCase();
    return `ab-badge ab-${value.replace(/_/g, "-")}`;
  };

  const stats = [
    {
      label: "Total Bookings",
      value: bookings.length,
      icon: "▦",
    },
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
    {
      label: "Paid Payments",
      value: bookings.filter((b) => b.paymentStatus === "PAID").length,
      icon: "₹",
    },
  ];

  return (
    <div className="ab-page">
      <header className="ab-header">
        <div>
          <span className="ab-eyebrow">THRONE8 / ADMINISTRATION</span>
          <h1>Bookings Management</h1>
          <p>
            Monitor sessions, booking statuses and payment records.
          </p>
        </div>

        <div className="ab-header-tag">ADMIN CONTROL CENTER</div>
      </header>

      <section className="ab-stats">
        {stats.map((stat) => (
          <article className="ab-stat-card" key={stat.label}>
            <div className="ab-stat-icon">{stat.icon}</div>
            <p>{stat.label}</p>
            <h2>{stat.value}</h2>
          </article>
        ))}
      </section>

      <section className="ab-panel">
        <div className="ab-panel-heading">
          <div>
            <h2>All Bookings</h2>
            <p>
              Review every booking registered on the platform.
            </p>
          </div>

          <span className="ab-count">
            {filteredBookings.length} of {bookings.length} bookings
          </span>
        </div>

        <div className="ab-filters">
          <input
            type="search"
            placeholder="Search student, mentor or booking ID..."
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

          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            aria-label="Filter payment status"
          >
            <option value="ALL">All Payment Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="PAID">Paid</option>
            <option value="FAILED">Failed</option>
            <option value="REFUNDED">Refunded</option>
          </select>
        </div>

        {loading && (
          <div className="ab-message">Loading bookings...</div>
        )}

        {!loading && error && (
          <div className="ab-message ab-error">{error}</div>
        )}

        {!loading && !error && (
          <div className="ab-table-wrap">
            <table className="ab-table">
              <thead>
                <tr>
                  <th>STUDENT</th>
                  <th>MENTOR</th>
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
                        <strong>
                          {booking.student?.name || "N/A"}
                        </strong>
                        <small>
                          {booking.student?.email ||
                            "Student details unavailable"}
                        </small>
                      </td>

                      <td>
                        <strong>
                          {booking.mentor?.name || "N/A"}
                        </strong>
                        <small>
                          {booking.mentor?.email ||
                            "Mentor details unavailable"}
                        </small>
                      </td>

                      <td>
                        {booking.sessionDate
                          ? new Date(
                              booking.sessionDate
                            ).toLocaleDateString("en-IN", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })
                          : "N/A"}
                      </td>

                      <td className="ab-amount">
                        {formatAmount(booking.amountPaise)}
                      </td>

                      <td>
                        <span className={badgeClass(booking.status)}>
                          {booking.status || "UNKNOWN"}
                        </span>
                      </td>

                      <td>
                        <span
                          className={badgeClass(booking.paymentStatus)}
                        >
                          {booking.paymentStatus || "UNKNOWN"}
                        </span>
                      </td>

                      <td>
                        {canComplete ? (
                          <button
                            type="button"
                            disabled={actionLoading === booking._id}
                            onClick={() =>
                              handleCompleteBooking(booking._id)
                            }
                          >
                            {actionLoading === booking._id
                              ? "Completing..."
                              : "Complete Booking"}
                          </button>
                        ) : (
                          <span>
                            {booking.status === "COMPLETED"
                              ? "Completed"
                              : "—"}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}

                {filteredBookings.length === 0 && (
                  <tr>
                    <td colSpan={7} className="ab-empty">
                      No bookings match your search or filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <footer className="ab-footer">
        THRONE8 Admin Panel <span>•</span> Bookings Overview
      </footer>
    </div>
  );
}

export default AdminBookings;
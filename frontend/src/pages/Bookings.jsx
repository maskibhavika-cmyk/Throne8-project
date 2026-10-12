
import { useEffect, useState } from "react";
import axios from "axios";

function Bookings() {
  const [bookings, setBookings] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");

    axios
      .get("http://localhost:5000/api/v1/admin/bookings", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setBookings(res.data.bookings))
      .catch((err) =>
        setError(
          err.response?.data?.message || "Bookings load nahi hui"
        )
      )
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <h2>Loading bookings...</h2>;
  if (error) return <p>{error}</p>;

  return (
    <div style={{ padding: "30px", background: "#f4f6fb", minHeight: "100vh" }}>
      <h1>Bookings Management</h1>
      <p>Total Bookings: {bookings.length}</p>

      <div style={{ overflowX: "auto", background: "white" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead style={{ background: "#151b35", color: "white" }}>
            <tr>
              <th style={{ padding: "15px" }}>Student</th>
              <th>Mentor</th>
              <th>Date</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Payment</th>
            </tr>
          </thead>

          <tbody>
            {bookings.map((booking) => (
              <tr key={booking._id}>
                <td style={{ padding: "15px" }}>
                  {booking.student?.name || "N/A"}
                </td>
                <td>{booking.mentor?.name || "N/A"}</td>
                <td>
                  {booking.sessionDate
                    ? new Date(booking.sessionDate).toLocaleDateString("en-IN")
                    : "N/A"}
                </td>
                <td>
                  ₹{((booking.amountPaise || 0) / 100).toLocaleString("en-IN")}
                </td>
                <td>{booking.status || "N/A"}</td>
                <td>{booking.paymentStatus || "N/A"}</td>
              </tr>
            ))}

            {bookings.length === 0 && (
              <tr>
                <td colSpan="6" style={{ padding: "20px", textAlign: "center" }}>
                  No bookings found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Bookings;

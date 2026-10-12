import { useEffect, useState } from "react";
import axios from "axios";

const API = "http://localhost:5000/api/v1";

export default function Bookings() {
  const [bookings, setBookings] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const loadBookings = async () => {
    try {
      const token = localStorage.getItem("token");
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const mentorId = user._id || user.id;

      const res = await axios.get(`${API}/bookings/mentor/${mentorId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
  console.log("Bookings API response:", JSON.stringify(res.data, null, 2));
      setBookings(res.data.bookings || []);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Bookings load nahi hui. Backend route check karna hoga."
      );
    } finally {
      setLoading(false);
    }
  };

  const completeBooking = async (bookingId) => {
    try {
      const token = localStorage.getItem("token");

      await axios.patch(
        `${API}/bookings/${bookingId}/complete`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert("Booking completed successfully!");
      setError("");
      await loadBookings();
    } catch (err) {
      setError(
        err.response?.data?.message || "Booking complete nahi hui."
      );
    }
  };

  useEffect(() => {
  const fetchBookings = async () => {
    await loadBookings();
  };

  fetchBookings();
}, []);
  if (loading) return <p>Loading bookings...</p>;

  return (
    <div style={{ padding: 24 }}>
      <h1>My Bookings</h1>
      {error && <p style={{ color: "red" }}>{error}</p>}

      {bookings.map((booking) => (
        <div
          key={booking._id}
          style={{ padding: 16, marginBottom: 12, border: "1px solid #ccc" }}
        >
          <p>Booking ID: {booking._id}</p>
          <p>Status: {booking.status}</p>
          <p>Payment: {booking.paymentStatus}</p>

          {booking.status === "CONFIRMED" &&
            booking.paymentStatus === "PAID" && (
              <button onClick={() => completeBooking(booking._id)}>
                Complete Booking
              </button>
            )}
        </div>
      ))}
    </div>
  );
}
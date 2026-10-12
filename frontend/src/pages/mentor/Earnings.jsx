
import { useEffect, useState } from "react";
import axios from "axios";

const API = "http://localhost:5000/api/v1/payments";

export default function Earnings() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const user = JSON.parse(localStorage.getItem("user") || "null");
const mentorId = user?._id || user?.id;
  useEffect(() => {
    const token = localStorage.getItem("token");

    axios
      .get(`${API}/earnings/${mentorId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setData(res.data))
      .catch((err) =>
        setError(err.response?.data?.message || "Earnings load nahi hui")
      );
  }, [mentorId]);

  if (error) return <p>{error}</p>;
  if (!data) return <p>Loading earnings...</p>;

  const totals = data.totalByStatus || {};

  return (
    <div style={{ padding: 24, color: "#D0D9E5", background: "#0A1020", minHeight: "100vh" }}>
      <h1>My Earnings</h1>
      <p>Pending: ₹{(totals.pendingPaise || 0) / 100}</p>
      <p>On Hold: ₹{(totals.onHoldPaise || 0) / 100}</p>
      <p>Eligible: ₹{(totals.eligiblePaise || 0) / 100}</p>
      <p>Paid: ₹{(totals.paidPaise || 0) / 100}</p>
      <p>Reversed: ₹{(totals.reversedPaise || 0) / 100}</p>
    </div>
  );
}

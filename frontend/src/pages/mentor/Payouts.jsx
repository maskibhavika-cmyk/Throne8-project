
import { useEffect, useState } from "react";
import axios from "axios";

export default function Payouts() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const user = JSON.parse(localStorage.getItem("user") || "null");
const mentorId = user?._id || user?.id;
  useEffect(() => {
    const token = localStorage.getItem("token");

    axios
      .get(`http://localhost:5000/api/v1/payments/payouts/${mentorId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setData(res.data))
      .catch((err) =>
        setError(err.response?.data?.message || "Payouts load nahi hue")
      );
  }, [mentorId]);

  if (error) return <p>{error}</p>;
  if (!data) return <p>Loading payouts...</p>;

  return (
    <div style={{ padding: 24, color: "#D0D9E5", background: "#0A1020", minHeight: "100vh" }}>
      <h1>My Payouts</h1>
      <h3>Available: ₹{(data.availablePaise || 0) / 100}</h3>

      {data.payouts?.length ? (
        data.payouts.map((payout) => (
          <div key={payout._id} style={{ padding: 12, marginTop: 10, background: "#172238", borderRadius: 8 }}>
            <p>Amount: ₹{payout.amountPaise / 100}</p>
            <p>Status: {payout.status}</p>
            <p>Date: {new Date(payout.createdAt).toLocaleDateString("en-IN")}</p>
          </div>
        ))
      ) : (
        <p>No payouts found.</p>
      )}
    </div>
  );
}

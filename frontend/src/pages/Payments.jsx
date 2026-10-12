
import { useEffect, useState } from "react";
import axios from "axios";

function Payments() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");

    axios
      .get("http://localhost:5000/api/v1/admin/payments", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((res) => {
        setPayments(res.data.payments || []);
      })
      .catch((err) => {
        setError(
          err.response?.data?.message || "Payments load nahi hue."
        );
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <h2>Loading payments...</h2>;
  if (error) return <p>{error}</p>;

  return (
    <div style={{ padding: "30px", background: "#f4f6fb", minHeight: "100vh" }}>
      <h1>Payments Management</h1>
      <p>Total Payments: {payments.length}</p>

      <div style={{ overflowX: "auto", background: "white" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead style={{ background: "#151b35", color: "white" }}>
            <tr>
              <th style={{ padding: "12px" }}>Student</th>
              <th style={{ padding: "12px" }}>Email</th>
              <th style={{ padding: "12px" }}>Amount</th>
              <th style={{ padding: "12px" }}>Payment ID</th>
              <th style={{ padding: "12px" }}>Status</th>
              <th style={{ padding: "12px" }}>Date</th>
            </tr>
          </thead>

          <tbody>
            {payments.map((payment) => (
              <tr key={payment._id}>
                <td style={{ padding: "12px" }}>
                  {payment.student?.name || "N/A"}
                </td>
                <td style={{ padding: "12px" }}>
                  {payment.student?.email || "N/A"}
                </td>
                <td style={{ padding: "12px" }}>
                  ₹{((payment.amountPaise || 0) / 100).toLocaleString("en-IN")}
                </td>
                <td style={{ padding: "12px" }}>
                  {payment.razorpayPaymentId || "N/A"}
                </td>
                <td style={{ padding: "12px" }}>
                  {payment.status || "N/A"}
                </td>
                <td style={{ padding: "12px" }}>
                  {payment.createdAt
                    ? new Date(payment.createdAt).toLocaleDateString("en-IN")
                    : "N/A"}
                </td>
              </tr>
            ))}

            {payments.length === 0 && (
              <tr>
                <td colSpan="6" style={{ padding: "20px", textAlign: "center" }}>
                  No payments found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Payments;

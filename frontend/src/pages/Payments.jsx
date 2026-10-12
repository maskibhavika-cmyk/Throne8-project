
import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import "./Payments.css";

function Payments() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    const token = localStorage.getItem("token");

    axios
      .get("http://localhost:5000/api/v1/admin/payments", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((res) => {
        setPayments(
          Array.isArray(res.data.payments) ? res.data.payments : []
        );
      })
      .catch((err) => {
        setError(
          err.response?.data?.message || "Payments load nahi hue."
        );
      })
      .finally(() => setLoading(false));
  }, []);

  const filteredPayments = useMemo(() => {
    return payments.filter((payment) => {
      const name = payment.student?.name || "";
      const email = payment.student?.email || "";
      const paymentId = payment.razorpayPaymentId || "";
      const query = search.trim().toLowerCase();

      const matchesSearch =
        name.toLowerCase().includes(query) ||
        email.toLowerCase().includes(query) ||
        paymentId.toLowerCase().includes(query);

      const matchesStatus =
        statusFilter === "all" ||
        (payment.status || "").toLowerCase() === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [payments, search, statusFilter]);

  const countStatus = (status) =>
    payments.filter(
      (payment) => (payment.status || "").toLowerCase() === status
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
      <div className="payments-page">
        <div className="payments-state">Loading payments...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="payments-page">
        <div className="payments-error">
          <h2>Unable to load payments</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="payments-page">
      <header className="payments-header">
        <div>
          <span className="payments-eyebrow">THRONE8 ADMIN PANEL</span>
          <h1>Payments Management</h1>
          <p>Monitor transactions and track payment records.</p>
        </div>

        <div className="payments-total">
          <span className="payments-total-icon">₹</span>
          <div>
            <small>Total Payments</small>
            <h2>{payments.length}</h2>
          </div>
        </div>
      </header>

      <section className="payment-stats">
        <div className="payment-stat-card">
          <span className="payment-stat-icon">▤</span>
          <div>
            <p>Total Payments</p>
            <h2>{payments.length}</h2>
          </div>
        </div>

        <div className="payment-stat-card">
          <span className="payment-stat-icon paid-icon">✓</span>
          <div>
            <p>Successful</p>
            <h2>{countStatus("paid")}</h2>
          </div>
        </div>

        <div className="payment-stat-card">
          <span className="payment-stat-icon created-icon">◷</span>
          <div>
            <p>Created</p>
            <h2>{countStatus("created")}</h2>
          </div>
        </div>

        <div className="payment-stat-card">
          <span className="payment-stat-icon failed-icon">!</span>
          <div>
            <p>Failed</p>
            <h2>{countStatus("failed")}</h2>
          </div>
        </div>
      </section>

      <section className="payments-panel">
        <div className="payments-panel-heading">
          <div>
            <h2>All Transactions</h2>
            <p>Review payment details and transaction status.</p>
          </div>

          <span className="payment-record-count">
            {filteredPayments.length} records
          </span>
        </div>

        <div className="payments-toolbar">
          <input
            className="payments-search"
            type="search"
            placeholder="Search student, email or payment ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <select
            className="payments-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Payment Status</option>
            <option value="paid">Paid</option>
            <option value="created">Created</option>
            <option value="failed">Failed</option>
            <option value="pending">Pending</option>
          </select>
        </div>

        <div className="payments-table-wrap">
          <table className="payments-table">
            <thead>
              <tr>
                <th>STUDENT</th>
                <th>AMOUNT</th>
                <th>PAYMENT ID</th>
                <th>STATUS</th>
                <th>PAYMENT DATE</th>
              </tr>
            </thead>

            <tbody>
              {filteredPayments.map((payment) => (
                <tr key={payment._id}>
                  <td>
                    <div className="payment-student">
                      <span className="payment-avatar">
                        {(payment.student?.name || "N")
                          .charAt(0)
                          .toUpperCase()}
                      </span>

                      <div>
                        <strong>{payment.student?.name || "N/A"}</strong>
                        <small>{payment.student?.email || "N/A"}</small>
                      </div>
                    </div>
                  </td>

                  <td className="payment-amount">
                    {formatAmount(payment.amountPaise)}
                  </td>

                  <td className="payment-id">
                    {payment.razorpayPaymentId || "N/A"}
                  </td>

                  <td>
                    <span
                      className={`payment-status status-${(
                        payment.status || "unknown"
                      ).toLowerCase()}`}
                    >
                      {payment.status || "N/A"}
                    </span>
                  </td>

                  <td>{formatDate(payment.createdAt)}</td>
                </tr>
              ))}

              {filteredPayments.length === 0 && (
                <tr>
                  <td colSpan="5" className="payments-empty">
                    No matching payments found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="payments-table-footer">
          Showing {filteredPayments.length} of {payments.length} payments
        </div>
      </section>
    </div>
  );
}

export default Payments;

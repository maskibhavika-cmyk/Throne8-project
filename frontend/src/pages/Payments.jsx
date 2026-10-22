
import { useEffect, useMemo, useState, useCallback } from "react";
import axios from "axios";
import "./Payments.css";

const API = "http://localhost:5000/api/v1";

function Payments() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [selectedPayment, setSelectedPayment] = useState(null);
  const [refundAmount, setRefundAmount] = useState("");
  const [refundReason, setRefundReason] = useState("");
  const [refundLoading, setRefundLoading] = useState(false);
  const [refundMessage, setRefundMessage] = useState("");
  const [refundError, setRefundError] = useState("");

  // Load payments from backend
  const loadPayments = useCallback(async () => {
   try {
  const token = localStorage.getItem("token");

      const res = await axios.get(`${API}/admin/payments`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setPayments(
        Array.isArray(res.data.payments)
          ? res.data.payments
          : []
      );
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Payments load nahi hue."
      );
    } finally {
      setLoading(false);
    }
  }, []);

 useEffect(() => {
  let cancelled = false;

  const fetchPayments = async () => {
    try {
      const token = localStorage.getItem("token");

      const res = await axios.get(`${API}/admin/payments`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!cancelled) {
        setPayments(
          Array.isArray(res.data.payments)
            ? res.data.payments
            : []
        );
        setError("");
      }
    } catch (err) {
      if (!cancelled) {
        setError(
          err.response?.data?.message ||
            "Payments load nahi hue."
        );
      }
    } finally {
      if (!cancelled) {
        setLoading(false);
      }
    }
  };

  fetchPayments();

  return () => {
    cancelled = true;
  };
}, []);

  // Search and status filter
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

  // Count payments by status
  const countStatus = (status) =>
    payments.filter(
      (payment) =>
        (payment.status || "").toLowerCase() === status
    ).length;

  // Format amount from paise to rupees
  const formatAmount = (amount) =>
    `₹${((amount || 0) / 100).toLocaleString("en-IN")}`;

  // Format date
  const formatDate = (date) => {
    if (!date) return "N/A";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "N/A";
    }

    return parsedDate.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // Open refund form
  const openRefundForm = (payment) => {
    setSelectedPayment(payment);
    setRefundAmount("");
    setRefundReason("");
    setRefundError("");
    setRefundMessage("");
  };

  // Submit refund request
  const handleRefundSubmit = async (e) => {
    e.preventDefault();

    if (!selectedPayment || refundLoading) {
      return;
    }

    const amount = Number(refundAmount);
    const maxAmount = Number(
      selectedPayment.amountPaise || 0
    );

    if (!Number.isFinite(amount) || amount <= 0) {
      setRefundError("Valid refund amount enter karo.");
      return;
    }

    if (Math.round(amount * 100) > maxAmount) {
      setRefundError(
        "Refund amount payment se zyada nahi ho sakta."
      );
      return;
    }

    if (!refundReason.trim()) {
      setRefundError("Refund ka reason likho.");
      return;
    }

    const bookingId =
      typeof selectedPayment.booking === "object"
        ? selectedPayment.booking?._id
        : selectedPayment.booking;

    if (!bookingId) {
      setRefundError(
        "Booking ID payment record mein nahi mili. Backend record check karna hoga."
      );
      return;
    }

    try {
      setRefundLoading(true);
      setRefundError("");
      setRefundMessage("");

      const token = localStorage.getItem("token");

      const res = await axios.post(
        `${API}/payments/refunds`,
        {
          bookingId,
          paymentId: selectedPayment._id,
          amountPaise: Math.round(amount * 100),
          reason: refundReason.trim(),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setRefundMessage(
        res.data.message || "Refund request submit ho gayi."
      );

      setSelectedPayment(null);
      setRefundAmount("");
      setRefundReason("");

      await loadPayments();
    } catch (err) {
      setRefundError(
        err.response?.data?.message ||
          "Refund request submit nahi hui. Backend route check karo."
      );
    } finally {
      setRefundLoading(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="payments-page">
        <div className="payments-state">
          Loading payments...
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="payments-page">
        <div className="payments-error">
          <h2>Unable to load payments</h2>
          <p>{error}</p>

          <button type="button" onClick={loadPayments}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="payments-page">
      <header className="payments-header">
        <div>
          <span className="payments-eyebrow">
            THRONE8 ADMIN PANEL
          </span>
          <h1>Payments Management</h1>
          <p>
            Monitor transactions and track payment records.
          </p>
        </div>
      </header>

      {/* Refund success message */}
      {refundMessage && (
        <div
          className="refund-success-message"
          role="status"
        >
          {refundMessage}

          <button
            type="button"
            onClick={() => setRefundMessage("")}
            aria-label="Dismiss message"
          >
            ×
          </button>
        </div>
      )}

      {/* Payment statistics */}
      <section className="payment-stats">
        <div className="payment-stat-card">
          <span className="payment-stat-icon">▤</span>
          <div>
            <p>Total Payments</p>
            <h2>{payments.length}</h2>
          </div>
        </div>

        <div className="payment-stat-card">
          <span className="payment-stat-icon paid-icon">
            ✓
          </span>
          <div>
            <p>Successful</p>
            <h2>{countStatus("paid")}</h2>
          </div>
        </div>

        <div className="payment-stat-card">
          <span className="payment-stat-icon created-icon">
            ◷
          </span>
          <div>
            <p>Created</p>
            <h2>{countStatus("created")}</h2>
          </div>
        </div>

        <div className="payment-stat-card">
          <span className="payment-stat-icon failed-icon">
            !
          </span>
          <div>
            <p>Failed</p>
            <h2>{countStatus("failed")}</h2>
          </div>
        </div>
      </section>

      {/* Payments table */}
      <section className="payments-panel">
        <div className="payments-panel-heading">
          <div>
            <h2>All Transactions</h2>
            <p>
              Review payment details and transaction status.
            </p>
          </div>

          <span className="payment-record-count">
            {filteredPayments.length} records
          </span>
        </div>

        {/* Search and filter */}
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
                <th>ACTION</th>
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
                        <strong>
                          {payment.student?.name || "N/A"}
                        </strong>
                        <small>
                          {payment.student?.email || "N/A"}
                        </small>
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

                  <td>
                    {(payment.status || "").toLowerCase() ===
                    "paid" ? (
                      <button
                        type="button"
                        className="refund-open-btn"
                        onClick={() => openRefundForm(payment)}
                      >
                        Request Refund
                      </button>
                    ) : (
                      <span className="refund-not-available">
                        —
                      </span>
                    )}
                  </td>
                </tr>
              ))}

              {filteredPayments.length === 0 && (
                <tr>
                  <td
                    colSpan="6"
                    className="payments-empty"
                  >
                    No matching payments found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="payments-table-footer">
          Showing {filteredPayments.length} of {payments.length}{" "}
          payments
        </div>
      </section>

      {/* Refund request modal */}
      {selectedPayment && (
        <div
          className="refund-modal-overlay"
          onMouseDown={(e) => {
            if (
              e.target === e.currentTarget &&
              !refundLoading
            ) {
              setSelectedPayment(null);
            }
          }}
        >
          <form
            className="refund-modal"
            onSubmit={handleRefundSubmit}
          >
            <h2>Request Refund</h2>
            <p>
              Review the payment before submitting a refund
              request.
            </p>

            <div className="refund-payment-summary">
              <span>Payment ID</span>
              <strong>
                {selectedPayment.razorpayPaymentId ||
                  selectedPayment._id}
              </strong>

              <span>Original amount</span>
              <strong>
                {formatAmount(selectedPayment.amountPaise)}
              </strong>
            </div>

            <label htmlFor="refund-amount">
              Refund amount (₹)
            </label>

            <input
              id="refund-amount"
              type="number"
              min="0.01"
              step="0.01"
              max={
                Number(selectedPayment.amountPaise || 0) / 100
              }
              value={refundAmount}
              onChange={(e) =>
                setRefundAmount(e.target.value)
              }
              placeholder="Enter amount"
              required
            />

            <label htmlFor="refund-reason">
              Reason for refund
            </label>

            <textarea
              id="refund-reason"
              value={refundReason}
              onChange={(e) =>
                setRefundReason(e.target.value)
              }
              placeholder="Explain why this refund is requested..."
              maxLength={500}
              required
            />

            {refundError && (
              <p
                className="refund-error-message"
                role="alert"
              >
                {refundError}
              </p>
            )}

            <div className="refund-modal-actions">
              <button
                type="button"
                className="refund-cancel-btn"
                onClick={() => setSelectedPayment(null)}
                disabled={refundLoading}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="refund-submit-btn"
                disabled={refundLoading}
              >
                {refundLoading
                  ? "Submitting..."
                  : "Submit Request"}
              </button>
            </div>

            <p className="refund-disclaimer">
              Submitting a request does not confirm that money
              has been refunded.
            </p>
          </form>
        </div>
      )}
    </div>
  );
}

export default Payments;

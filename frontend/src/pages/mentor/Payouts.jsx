
import { useEffect, useState } from "react";
import axios from "axios";

const API = "http://localhost:5000/api/v1";

const formatRupees = (paise = 0) =>
  (Number(paise) / 100).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const formatDate = (date) => {
  if (!date) return "—";
  const parsed = new Date(date);
  return Number.isNaN(parsed.getTime())
    ? "—"
    : parsed.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
};

const statusStyle = (status) => {
  const styles = {
    PAID: { color: "#86efac", background: "#143a2b" },
    COMPLETED: { color: "#86efac", background: "#143a2b" },
    PROCESSING: { color: "#93c5fd", background: "#172e50" },
    PENDING: { color: "#fcd34d", background: "#453519" },
    FAILED: { color: "#fca5a5", background: "#482127" },
  };

  return styles[status] || { color: "#cbd5e1", background: "#263247" };
};

function StatCard({ label, value, icon, note }) {
  return (
    <div className="payout-stat-card">
      <div className="payout-stat-top">
        <span>{label}</span>
        <span className="payout-stat-icon">{icon}</span>
      </div>
      <div className="payout-stat-value">{value}</div>
      <div className="payout-stat-note">{note}</div>
    </div>
  );
}

export default function Payouts() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [retry, setRetry] = useState(0);

  const user = (() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  })();

  const mentorId = user?._id || user?.id;

  useEffect(() => {
    let cancelled = false;

    const loadPayouts = async () => {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("token");

      if (!token || !mentorId) {
        setError("Session nahi mili. Please dobara login karein.");
        setLoading(false);
        return;
      }

      try {
        const res = await axios.get(
          `${API}/payments/payouts/${mentorId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (!cancelled) setData(res.data);
      } catch (err) {
        if (!cancelled) {
          setError(
            err.response?.data?.message || "Payouts load nahi ho paaye."
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadPayouts();

    return () => {
      cancelled = true;
    };
  }, [mentorId, retry]);

  const payouts = Array.isArray(data?.payouts) ? data.payouts : [];
  const availablePaise = Number(data?.availablePaise) || 0;

  const paidPaise = payouts
    .filter((p) => ["PAID", "COMPLETED"].includes(p.status))
    .reduce((sum, p) => sum + (Number(p.amountPaise) || 0), 0);

  const pendingCount = payouts.filter((p) =>
    ["PENDING", "PROCESSING"].includes(p.status)
  ).length;

  return (
    <main className="payout-page">
      <div className="payout-container">
        <header className="payout-heading">
          <div>
            <div className="payout-eyebrow">
              <span className="payout-live-dot" />
              MENTOR FINANCE
            </div>
            <h1>My Payouts</h1>
            <p>Track your earnings and payout activity in one place.</p>
          </div>

          <button
            className="payout-refresh"
            onClick={() => setRetry((value) => value + 1)}
            disabled={loading}
          >
            ↻ {loading ? "Loading..." : "Refresh"}
          </button>
        </header>

        {error ? (
          <section className="payout-message payout-error">
            <h2>Unable to load payouts</h2>
            <p>{error}</p>
            <button onClick={() => setRetry((value) => value + 1)}>
              Try again
            </button>
          </section>
        ) : loading && !data ? (
          <div className="payout-stats">
            {[1, 2, 3].map((item) => (
              <div className="payout-stat-card payout-skeleton" key={item}>
                <div />
                <div />
                <div />
              </div>
            ))}
          </div>
        ) : (
          <>
            <section className="payout-stats">
              <StatCard
                label="Available balance"
                value={`₹${formatRupees(availablePaise)}`}
                icon="₹"
                note="Currently available"
              />
              <StatCard
                label="Total paid out"
                value={`₹${formatRupees(paidPaise)}`}
                icon="↗"
                note="Based on listed payout records"
              />
              <StatCard
                label="Payout activity"
                value={String(pendingCount)}
                icon="◷"
                note="Pending or processing"
              />
            </section>

            <section className="payout-panel">
              <div className="payout-panel-heading">
                <div>
                  <h2>Payout history</h2>
                  <p>Your recorded payout transactions</p>
                </div>
                <span className="payout-count">
                  {payouts.length} records
                </span>
              </div>

              {payouts.length > 0 ? (
                <div className="payout-table-wrap">
                  <table className="payout-table">
                    <thead>
                      <tr>
                        <th>Transaction</th>
                        <th>Date</th>
                        <th>Amount</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payouts.map((payout) => (
                        <tr key={payout._id}>
                          <td>
                            <div className="payout-transaction">
                              <span className="payout-transaction-icon">
                                ₹
                              </span>
                              <div>
                                <strong>Payout transfer</strong>
                                <small>
                                  ID: {payout._id || "Not available"}
                                </small>
                              </div>
                            </div>
                          </td>
                          <td>{formatDate(payout.createdAt)}</td>
                          <td className="payout-amount">
                            ₹{formatRupees(payout.amountPaise)}
                          </td>
                          <td>
                            <span
                              className="payout-status"
                              style={statusStyle(payout.status)}
                            >
                              {payout.status || "UNKNOWN"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="payout-empty">
                  <div className="payout-empty-icon">₹</div>
                  <h3>No payouts yet</h3>
                  <p>
                    Your payout transactions will appear here once they are
                    recorded.
                  </p>
                </div>
              )}

              <footer className="payout-panel-footer">
                <span>THRONE8 · Mentor dashboard</span>
                <span>Amounts displayed in INR</span>
              </footer>
            </section>
          </>
        )}
      </div>
    </main>
  );
}

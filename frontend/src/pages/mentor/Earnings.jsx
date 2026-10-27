import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Earnings.css";

const API = "http://localhost:5000/api/v1";

const formatMoney = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);

function Earnings() {
  const navigate = useNavigate();

  const [mentorId] = useState(() => {
    try {
      const savedId = localStorage.getItem("mentorId");
      if (savedId) return savedId;

      const user = JSON.parse(localStorage.getItem("user") || "null");
      return user?._id || user?.id || null;
    } catch {
      return null;
    }
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [summary, setSummary] = useState({
    total: 0,
    paid: 0,
    pending: 0,
    hold: 0,
    eligible: 0,
    reversed: 0,
    processing: 0,
  });
  const [ledger, setLedger] = useState([]);
  const [payouts, setPayouts] = useState([]);

  useEffect(() => {
  const controller = new AbortController();

  async function loadEarnings() {
    if (!mentorId) {
      setError("Mentor ID nahi mila. Dobara login karo.");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(
        `${API}/earnings/mentor/${mentorId}`,
        { signal: controller.signal }
      );

      if (!response.ok) {
        throw new Error("Earnings load nahi hui. Backend check karo.");
      }

      const data = await response.json();

      setSummary({
        total: data.summary?.total || 0,
        paid: data.summary?.paid || 0,
        pending: data.summary?.pending || 0,
        hold: data.summary?.hold || 0,
        eligible: data.summary?.eligible || 0,
        reversed: data.summary?.reversed || 0,
        processing: data.summary?.processing || 0,
      });

      setLedger(Array.isArray(data.ledger) ? data.ledger : []);
      setPayouts(Array.isArray(data.payouts) ? data.payouts : []);
      setError("");
    } catch (err) {
      if (err.name !== "AbortError") {
        setError(err.message || "Something went wrong.");
      }
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
      }
    }
  }

  loadEarnings();

  return () => controller.abort();
}, [mentorId]);

  if (loading) {
    return (
      <main className="earnings-page">
        <div className="earnings-message">Loading earnings...</div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="earnings-page">
        <div className="earnings-message earnings-error">
          <h2>Unable to load earnings</h2>
          <p>{error}</p>
          <button onClick={() => window.location.reload()}>Try again</button>
        </div>
      </main>
    );
  }

  const cards = [
    { label: "Total Earnings", value: summary.total, color: "purple" },
    { label: "Paid to Bank", value: summary.paid, color: "green" },
    { label: "Eligible for Payout", value: summary.eligible, color: "blue" },
    { label: "15-Day Hold", value: summary.hold, color: "orange" },
    { label: "Pending Sessions", value: summary.pending, color: "gray" },
    { label: "Processing", value: summary.processing, color: "cyan" },
  ];

  return (
    <main className="earnings-page">
      <div className="earnings-container">
        <header className="earnings-header">
          <div>
            <span className="earnings-label">MENTOR DASHBOARD</span>
            <h1>My Earnings</h1>
            <p>Keep track of your income and payouts.</p>
          </div>

          <button
            className="earnings-button"
            disabled={Number(summary.eligible) <= 0}
            onClick={() => navigate("/mentor-payout")}
          >
            Request Payout
          </button>
        </header>

        <section className="earnings-overview">
          <div>
            <span className="overview-label">Total Recorded Earnings</span>
            <h2>{formatMoney(summary.total)}</h2>
            <p>Your earnings at a glance.</p>
          </div>

          <div className="overview-details">
            <div>
              <span>Already paid</span>
              <strong>{formatMoney(summary.paid)}</strong>
            </div>
            <div>
              <span>Available for payout</span>
              <strong>{formatMoney(summary.eligible)}</strong>
            </div>
          </div>
        </section>

        <section className="earnings-section">
          <div className="section-heading">
            <div>
              <h2>Financial Summary</h2>
              <p>A quick look at your earnings status.</p>
            </div>
          </div>

          <div className="earnings-grid">
            {cards.map((card) => (
              <article className="earnings-card" key={card.label}>
                <div className="card-heading">
                  <span>{card.label}</span>
                  <span className={`card-icon ${card.color}`}>₹</span>
                </div>
                <strong>{formatMoney(card.value)}</strong>
              </article>
            ))}
          </div>
        </section>

        <section className="earnings-section">
          <div className="section-heading">
            <div>
              <h2>Earnings History</h2>
              <p>Details of your session earnings.</p>
            </div>
            <span className="record-count">{ledger.length} records</span>
          </div>

          <div className="earnings-panel">
            {ledger.length === 0 ? (
              <div className="empty-state">
                <span>₹</span>
                <h3>No earnings yet</h3>
                <p>Your session earnings will appear here.</p>
              </div>
            ) : (
              <div className="table-wrapper">
                <table className="earnings-table">
                  <thead>
                    <tr>
                      <th>Student / Booking</th>
                      <th>Session Fee</th>
                      <th>Commission</th>
                      <th>Your Earnings</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ledger.map((item, index) => (
                      <tr key={item._id || item.bookingId || index}>
                        <td>
                          <strong>{item.student || "Student"}</strong>
                          <small>Booking: {item.bookingId || "—"}</small>
                        </td>
                        <td>{formatMoney(item.sessionFee)}</td>
                        <td>{formatMoney(item.commission)}</td>
                        <td className="amount">
                          {formatMoney(item.yourEarning)}
                        </td>
                        <td>
                          <span className="status-badge">
                            {item.status || "Pending"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>

        <section className="earnings-section">
          <div className="section-heading">
            <div>
              <h2>Payout History</h2>
              <p>Your payout and transfer records.</p>
            </div>
          </div>

          <div className="earnings-panel">
            {payouts.length === 0 ? (
              <div className="empty-state">
                <span>↗</span>
                <h3>No payouts yet</h3>
                <p>Your payout records will appear here.</p>
              </div>
            ) : (
              <div className="payout-list">
                {payouts.map((payout, index) => (
                  <div
                    className="payout-row"
                    key={payout._id || payout.transferId || index}
                  >
                    <div className="payout-symbol">₹</div>
                    <div className="payout-info">
                      <strong>
                        {payout.bookingId ||
                          payout.transferId ||
                          `Payout ${index + 1}`}
                      </strong>
                      <span>{payout.status || payout.state || "Pending"}</span>
                    </div>
                    <strong>
                      {formatMoney(
                        payout.amountPaise != null
                          ? payout.amountPaise / 100
                          : payout.amount || 0
                      )}
                    </strong>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        <footer className="earnings-footer">
          THRONE8 <span>·</span> Mentor Earnings
        </footer>
      </div>
    </main>
  );
}

export default Earnings;
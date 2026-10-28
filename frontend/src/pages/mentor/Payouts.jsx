
import { useCallback, useEffect, useState } from "react";
import "./Payouts.css";

const API = "http://localhost:5000/api/v1";

const money = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
  }).format(Number(value || 0));

export default function Payouts() {
  const [summary, setSummary] = useState({
    availableBalance: 0,
    totalPaid: 0,
    processing: 0,
    hold: 0,
  });
  const [payouts, setPayouts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    const token = localStorage.getItem("token");
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const mentorId =
      localStorage.getItem("mentorId") || user._id || user.id;

    if (!token || !mentorId) {
      setMessage("Please log in with your mentor account.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const headers = { Authorization: `Bearer ${token}` };

      const [summaryRes, payoutsRes] = await Promise.all([
        fetch(
          `${API}/payouts/summary?mentorId=${encodeURIComponent(mentorId)}`,
          { headers }
        ),
        fetch(`${API}/payouts/${mentorId}`, { headers }),
      ]);

      const summaryData = await summaryRes.json();
      const payoutsData = await payoutsRes.json();

      if (!summaryRes.ok) {
        throw new Error(summaryData.message || "Unable to load payout summary");
      }

      if (!payoutsRes.ok) {
        throw new Error(payoutsData.message || "Unable to load payout history");
      }

      setSummary({
        availableBalance: Number(summaryData.availablePaise || 0) / 100,
        totalPaid: Array.isArray(payoutsData.payouts)
          ? payoutsData.payouts
              .filter((p) => p.status === "PAID")
              .reduce((sum, p) => sum + Number(p.amountPaise || 0), 0) / 100
          : 0,
        processing: Array.isArray(payoutsData.payouts)
          ? payoutsData.payouts
              .filter((p) =>
                ["PENDING", "APPROVED", "PROCESSING"].includes(p.status)
              )
              .reduce((sum, p) => sum + Number(p.amountPaise || 0), 0) / 100
          : 0,
      hold: Number(summaryData.holdPaise || 0) / 100,
      });

      setPayouts(Array.isArray(payoutsData.payouts) ? payoutsData.payouts : []);
    } catch (error) {
      setMessage(error.message || "Unable to load payout details.");
    } finally {
      setLoading(false);
    }
  }, []);
useEffect(() => {
  const timer = setTimeout(() => {
    load();
  }, 0);

  return () => clearTimeout(timer);
}, [load]);

  const requestPayout = async () => {
    const token = localStorage.getItem("token");
    setRequesting(true);
    setMessage("");

    try {
      const response = await fetch(`${API}/payouts/request`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          amountPaise: Math.round(summary.availableBalance * 100),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Payout request failed");
      }

      setMessage("Payout request submitted successfully.");
      await load();
    } catch (error) {
      setMessage(error.message || "Payout request failed.");
    } finally {
      setRequesting(false);
    }
  };

  return (
    <main className="payout-page">
      <section className="payout-heading">
        <div>
          <span className="payout-eyebrow">THRONE8 · MENTOR FINANCE</span>
          <h1>Payouts & Transfers</h1>
          <p>Track your eligible earnings, payout requests and transfers.</p>
        </div>
        <button className="payout-refresh" onClick={load} disabled={loading}>
          ↻ {loading ? "Refreshing..." : "Refresh"}
        </button>
      </section>

      {message && <div className="payout-message" role="status">{message}</div>}

      <section className="payout-cards">
        <article className="payout-card payout-available">
          <span>Available balance</span>
          <strong>{money(summary.availableBalance)}</strong>
          <small>Ready to request</small>
        </article>
        <article className="payout-card">
          <span>Total paid</span>
          <strong>{money(summary.totalPaid)}</strong>
          <small>Successful payouts</small>
        </article>
        <article className="payout-card">
          <span>Processing</span>
          <strong>{money(summary.processing)}</strong>
          <small>Pending and active requests</small>
        </article>
        <article className="payout-card">
          <span>15-day hold</span>
          <strong>{money(summary.hold)}</strong>
          <small>Not yet available for payout</small>
        </article>
      </section>

      <section className="payout-request-panel">
        <div>
          <h2>Request a payout</h2>
          <p>Only eligible earnings can be requested. Requests are subject to verification.</p>
        </div>
        <button
          className="payout-request-button"
          onClick={requestPayout}
          disabled={requesting || loading || summary.availableBalance <= 0}
        >
          {requesting ? "Submitting..." : "Request Payout"}
        </button>
      </section>

      <section className="payout-history">
        <div className="payout-history-heading">
          <div>
            <h2>Payout history</h2>
            <p>Your recorded payout requests and transfer status.</p>
          </div>
          <span>{payouts.length} records</span>
        </div>

        {payouts.length === 0 ? (
          <div className="payout-empty">
            <div className="payout-empty-icon">↗</div>
            <h3>No payouts yet</h3>
            <p>Your payout requests will appear here after you submit one.</p>
          </div>
        ) : (
          <div className="payout-table-wrap">
            <table className="payout-table">
              <thead>
                <tr>
                  <th>Request ID</th>
                  <th>Date</th>
                  <th>Amount</th>
                  <th>Transfer ID</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {payouts.map((payout) => (
                  <tr key={payout._id}>
                    <td>{String(payout._id).slice(-8).toUpperCase()}</td>
                    <td>
                      {payout.createdAt
                        ? new Date(payout.createdAt).toLocaleDateString("en-IN")
                        : "—"}
                    </td>
                    <td>{money(Number(payout.amountPaise || 0) / 100)}</td>
                    <td>{payout.providerPayoutId || "Not assigned"}</td>
                    <td>
                      <span className={`payout-status status-${String(payout.status || "").toLowerCase()}`}>
                        {payout.status || "UNKNOWN"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}

import { useEffect, useState } from "react";
import axios from "axios";
import "./Earnings.css";

function inr(n) {
  return Number(n || 0).toLocaleString("en-IN", { style: "currency", currency: "INR" });
}

export default function Earnings() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const user = JSON.parse(localStorage.getItem("user") || "null");
  const mentorId = user?._id || user?.id;

  useEffect(() => {
    async function load() {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`http://localhost:5000/api/earnings/mentor/${mentorId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setData(res.data);
      } catch (e) {
        setError(e.response?.data?.message || "Load nahi hui");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [mentorId]);

  if (loading) return <div className="earnings-page">Loading...</div>;
  if (error) return <div className="earnings-page"><p style={{ color: "red" }}>{error}</p></div>;

  const summary = data?.summary || { total: 0, paid: 0, pending: 0, hold: 0, eligible: 0, reversed: 0, processing: 0 };
  const ledger = data?.ledger || [];
  const payouts = data?.payouts || [];

  const cards = [
    { title: "Total earned", amount: summary.total },
    { title: "Paid to bank", amount: summary.paid },
    { title: "Awaiting session", amount: summary.pending },
    { title: "In 15-day hold", amount: summary.hold },
    { title: "Eligible", amount: summary.eligible },
    { title: "Processing", amount: summary.processing },
    { title: "On hold", amount: summary.reversed },
  ];

  return (
    <main className="earnings-page">
      <div className="earnings-header">
        <div>
          <h1 className="earnings-heading">My earnings</h1>
          <p className="earnings-sub">{user?.name} • Mentor • Commission 20% per session</p>
          <p className="earnings-note">Note: Payments in 15-day hold are not counted in your eligible earnings until the session is marked complete.</p>
        </div>
        <button className="earnings-btn" onClick={() => window.location.reload()}>Refresh</button>
      </div>

      <section className="earnings-grid">
        {cards.map(c => (
          <div key={c.title} className="earnings-card">
            <p className="earnings-card-title">{c.title}</p>
            <h2 className="earnings-amount">{inr(c.amount)}</h2>
          </div>
        ))}
      </section>

      <section className="earnings-panel">
        <h2>Earnings ledger</h2>
        {ledger.length === 0 ? <p className="earnings-empty">No sessions in ledger yet.</p> : (
          <table className="earnings-table">
            <thead><tr>
              <th className="earnings-th">Booking ID</th>
              <th className="earnings-th">Student</th>
              <th className="earnings-th">Session fee</th>
              <th className="earnings-th">Commission</th>
              <th className="earnings-th">Your earning</th>
              <th className="earnings-th">Status</th>
              <th className="earnings-th">Payout date</th>
            </tr></thead>
            <tbody>
              {ledger.map((r, i) => (
                <tr key={i}>
                  <td className="earnings-td">{r.bookingId}</td>
                  <td className="earnings-td">{r.student}</td>
                  <td className="earnings-td">{inr(r.sessionFee)}</td>
                  <td className="earnings-td">{inr(r.commission)}</td>
                  <td className="earnings-td">{inr(r.yourEarning)}</td>
                  <td className="earnings-td">{r.status}</td>
                  <td className="earnings-td">{r.payoutDate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <p className="earnings-note">Payout rule: Payments enter a 15-day hold after the session completes. After the hold ends, they move to Eligible and are paid out in the next payout run.</p>

      <section className="earnings-panel">
        <h2>Payout history</h2>
        {payouts.length === 0 ? <p className="earnings-empty">No payouts yet. Your eligible earnings will be transferred to your bank after the hold period.</p> : (
          <table className="earnings-table">
            <thead><tr><th className="earnings-th">Transfer ID</th><th className="earnings-th">Booking</th><th className="earnings-th">Amount</th><th className="earnings-th">Status</th></tr></thead>
            <tbody>{payouts.map((p, i) => (
              <tr key={i}><td className="earnings-td">{p.transferId || p._id}</td><td className="earnings-td">{p.booking || "-"}</td><td className="earnings-td">{inr(p.amount)}</td><td className="earnings-td">{p.status || "Paid to bank"}</td></tr>
            ))}</tbody>
          </table>
        )}
      </section>

      <section className="earnings-panel">
        <h2>Statement October 2026</h2>
        <div className="earnings-row"><span>Total earned in October</span><strong>{inr(summary.total)}</strong></div>
        <div className="earnings-row"><span>Paid to bank in October</span><strong>{inr(summary.paid)}</strong></div>
        <button className="earnings-btn" style={{ marginTop: "16px" }}>Download statement</button>
      </section>
    </main>
  );
}
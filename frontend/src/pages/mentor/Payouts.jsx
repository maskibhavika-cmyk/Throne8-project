import { useEffect, useState } from "react";
import "./Payouts.css";

export default function Payouts() {
  const [summary, setSummary] = useState({ availableBalance: 0, totalPaidOut: 0, pendingCount: 0, pendingAmount: 0 });
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const mentorId = localStorage.getItem("mentorId");

  const load = async () => {
    setLoading(true);
    try {
      const sRes = await fetch(`http://localhost:5000/api/payouts/summary?mentorId=${mentorId}`);
      setSummary(await sRes.json());
      const hRes = await fetch(`http://localhost:5000/api/payouts?mentorId=${mentorId}`);
      const hData = await hRes.json();
      setHistory(Array.isArray(hData) ? hData : []);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => {
    let isMounted = true;
    const fetchInitial = async () => {
      try {
        const sRes = await fetch(`http://localhost:5000/api/payouts/summary?mentorId=${mentorId}`);
        const sData = await sRes.json();
        const hRes = await fetch(`http://localhost:5000/api/payouts?mentorId=${mentorId}`);
        const hData = await hRes.json();
        if (isMounted) {
          setSummary(sData);
          setHistory(Array.isArray(hData) ? hData : []);
          setLoading(false);
        }
      } catch (e) {
        console.error(e);
        if (isMounted) setLoading(false);
      }
    };
    fetchInitial();
    return () => { isMounted = false; };
  }, [mentorId]);

  const requestPayout = async () => {
    const res = await fetch(`http://localhost:5000/api/payouts/request`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mentorId })
    });
    const data = await res.json();
    if (!res.ok) {
      alert(data.message || "Koi eligible balance nahi hai");
      return;
    }
    load();
  };

  return (
    <div className="payout-page">
      <div className="payout-container">
        <div className="payout-header">
          <h1>MENTOR FINANCE</h1>
          <button className="refresh-btn" onClick={load}>↻ Refresh</button>
        </div>
        <p className="payout-sub">Track your earnings and payout activity in one place.</p>

        <div className="payout-cards">
          <div className="payout-card">
            <label>Available balance</label>
            <strong>₹{summary.availableBalance?.toFixed(2)}</strong>
            <small>Currently available</small>
          </div>
          <div className="payout-card">
            <label>Total paid out ↗</label>
            <strong>₹{summary.totalPaidOut?.toFixed(2)}</strong>
            <small>Based on listed payout records</small>
          </div>
          <div className="payout-card">
            <label>Payout activity ◷</label>
            <strong>{summary.pendingCount}</strong>
            <small>Pending or processing (₹{summary.pendingAmount?.toFixed(2)})</small>
          </div>
        </div>

        <button className="request-btn" onClick={requestPayout}>Request Payout</button>

        <h2 className="payout-title">Payout history</h2>
        <p className="payout-desc">Your recorded payout transactions</p>

        {loading ? (
          <p style={{ color: "#9CA3AF" }}>Loading...</p>
        ) : history.length === 0 ? (
          <div className="empty-state">
            <div className="icon">₹</div>
            <p>No payouts yet</p>
            <small>Your payout transactions will appear here once they are recorded.</small>
          </div>
        ) : (
          <div className="payout-table">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Reference</th>
                </tr>
              </thead>
              <tbody>
                {history.map(p => (
                  <tr key={p._id}>
                    <td>{new Date(p.createdAt).toLocaleDateString("en-IN")}</td>
                    <td style={{ fontWeight: "700" }}>₹{(p.amountPaise/100).toFixed(2)}</td>
                    <td>
                      <span className={p.status === "PAID" ? "status-paid" : "status-pending"}>
                        {p.status}
                      </span>
                    </td>
                    <td style={{ color: "#9CA3AF" }}>{p.providerPayoutId || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <p className="payout-footer">THRONE8 · Mentor dashboard<br/>Amounts displayed in INR</p>
      </div>
    </div>
  );
}
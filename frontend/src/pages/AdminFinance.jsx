import { useEffect, useState } from "react";
import axios from "axios";
import { NavLink } from "react-router-dom";

const API = "http://localhost:5000/api/v1";

export default function AdminFinance() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    axios.get(`${API}/admin/stats`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(res => setStats(res.data.stats))
    .catch(err => setError(err.response?.data?.message || "Finance load nahi hua"));
  }, []);

  if (error) return <p style={{padding:24, color:"red"}}>{error}</p>;
  if (!stats) return <p style={{padding:24}}>Loading finance...</p>;

  const revenue = stats.totalRevenue || 0;
  const commission = Math.round(revenue * 0.2);
  const mentorShare = revenue - commission;

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <h2 className="admin-logo">♛ THRONE8</h2>
        <p className="sidebar-label">MAIN MENU</p>
        <NavLink to="/admin-dashboard" className="sidebar-link">▦ Dashboard</NavLink>
        <NavLink to="/admin-users" className="sidebar-link">👥 Users</NavLink>
        <NavLink to="/admin-bookings" className="sidebar-link">📅 Bookings</NavLink>
        <NavLink to="/admin-payments" className="sidebar-link">💳 Payments</NavLink>
        <NavLink to="/admin-finance" className="sidebar-link active">💰 Finance</NavLink>
        <NavLink to="/admin-earnings-queue" className="sidebar-link">⏳ Earnings Queue</NavLink>
        <NavLink to="/admin-refunds" className="sidebar-link">↩️ Refunds</NavLink>
      </aside>

      <main className="admin-main">
        <header className="admin-header">
          <div>
            <p className="admin-eyebrow">FINANCE</p>
            <h1>Finance Summary</h1>
            <p className="admin-subtitle">Total revenue, commission aur mentor share yahin dikhega.</p>
          </div>
        </header>

        <div className="stats-grid" style={{marginTop: 20}}>
          <div className="stat-card">
            <div className="stat-icon pink">💰</div>
            <p>Total Revenue</p>
            <h2>₹{(revenue / 100).toLocaleString("en-IN")}</h2>
          </div>
          <div className="stat-card">
            <div className="stat-icon orange">📊</div>
            <p>Commission (20%)</p>
            <h2>₹{(commission / 100).toLocaleString("en-IN")}</h2>
          </div>
          <div className="stat-card">
            <div className="stat-icon green">✅</div>
            <p>Mentor Share (80%)</p>
            <h2>₹{(mentorShare / 100).toLocaleString("en-IN")}</h2>
          </div>
          <div className="stat-card">
            <div className="stat-icon blue">💳</div>
            <p>Total Payments</p>
            <h2>{stats.totalPayments}</h2>
          </div>
        </div>
      </main>
    </div>
  );
}
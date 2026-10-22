import { useEffect, useState } from "react";
import axios from "axios";
import { NavLink } from "react-router-dom";

const API = "http://localhost:5000/api/v1";

function formatRupees(paise = 0) {
  return (Number(paise || 0) / 100).toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
  });
}

export default function AdminEarningsQueue() {
  const [mentors, setMentors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    axios.get(`${API}/payments/earnings/eligible-mentors`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    .then(res => setMentors(res.data.mentors || []))
    .catch(err => setError(err.response?.data?.message || "Queue load nahi hui"))
    .finally(() => setLoading(false));
  }, []);

  const handleApprove = async (m) => {
    const token = localStorage.getItem("token");
    await axios.patch(`${API}/payments/earnings/update-eligible`, { 
      earningId: m._id,
      mentorId: m.mentorId || m._id
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    setMentors(mentors.filter(x => x._id !== m._id));
  };

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <h2 className="admin-logo">♛ THRONE8</h2>
        <NavLink to="/admin-dashboard" className="sidebar-link">Dashboard</NavLink>
        <NavLink to="/admin-users" className="sidebar-link">Users</NavLink>
        <NavLink to="/admin-bookings" className="sidebar-link">Bookings</NavLink>
        <NavLink to="/admin-payments" className="sidebar-link">Payments</NavLink>
        <NavLink to="/admin-finance" className="sidebar-link">Finance</NavLink>
        <NavLink to="/admin-earnings-queue" className="sidebar-link active">Earnings Queue</NavLink>
        <NavLink to="/admin-refunds" className="sidebar-link">Refunds</NavLink>
      </aside>

      <main className="admin-main">
        <h1>Earnings Queue</h1>
        <p className="admin-subtitle">15 din ke hold ke baad eligible hone wali earnings.</p>

        {loading && <p>Loading...</p>}
        {error && <p style={{color: "red"}}>{error}</p>}
        {!loading && !error && mentors.length === 0 && <p>Queue khali hai.</p>}

        {mentors.map(m => (
          <div key={m._id} className="stat-card" style={{marginTop: 12, display: "flex", justifyContent: "space-between", alignItems: "center"}}>
            <div>
              <strong>{m.mentorName || "Mentor"}</strong>
              <p style={{margin: "4px 0", color: "#aaa", fontSize: 13}}>{m.mentorEmail || ""}</p>
              <p>Amount: {formatRupees(m.amountPaise ?? (m.amount ? m.amount * 100 : 0))}</p>
              <p style={{margin: "4px 0", fontSize: 13}}>Status: {m.status || "PENDING"}</p>
            </div>
            <button className="primary-btn" onClick={() => handleApprove(m)}>Mark Eligible</button>
          </div>
        ))}
      </main>
    </div>
  );
}
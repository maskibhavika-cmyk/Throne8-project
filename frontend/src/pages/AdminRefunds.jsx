import { useEffect, useState } from "react";
import axios from "axios";
import { NavLink } from "react-router-dom";

const API = "http://localhost:5000/api/v1";

export default function AdminRefunds() {
  const [refunds, setRefunds] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    axios.get(`${API}/payments/refunds`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(res => setRefunds(res.data.refunds || []))
    .finally(() => setLoading(false));
  }, []);

  const handleAction = async (id, action) => {
    try {
      const token = localStorage.getItem("token");
      await axios.post(`${API}/payments/refunds/${id}/${action}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRefunds(prev => prev.map(r => r._id === id ? { ...r, status: action === "approve" ? "APPROVED" : "REJECTED" } : r));
    } catch (err) {
      alert("Failed: " + (err.response?.data?.message || err.message));
    }
  };

  const getId = (v) => {
    if (!v) return "";
    if (typeof v === "string") return v;
    if (v.$oid) return v.$oid;
    if (v._id) return typeof v._id === "string" ? v._id : (v._id.$oid || "");
    return "";
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
        <NavLink to="/admin-earnings-queue" className="sidebar-link">Earnings Queue</NavLink>
        <NavLink to="/admin-refunds" className="sidebar-link active">Refunds</NavLink>
      </aside>

      <main className="admin-main">
        <h1>Refund Requests</h1>
        <p className="admin-subtitle">Approve karne par payment student ko wapas jayegi.</p>

        {loading && <p>Loading...</p>}
        {!loading && refunds.length === 0 && <p>Abhi koi refund pending nahi hai.</p>}

        {refunds.map(r => {
          const studentId = getId(r.student);
          const mentorId = getId(r.mentor);
          const studentName = r.student?.name || (studentId ? "Student " + studentId.slice(0, 6) : "Student");
          const mentorName = r.mentor?.name || (mentorId ? "Mentor " + mentorId.slice(0, 6) : "Mentor");
          const statusColor = r.status === "APPROVED" ? "#22c55e" : r.status === "REJECTED" ? "#f87171" : "#fbbf24";

          return (
            <div key={r._id} className="stat-card" style={{marginTop: 12, display: "flex", justifyContent: "space-between", alignItems: "center"}}>
              <div>
                <strong>{studentName}</strong>
                <p style={{margin: "4px 0", color: "#aaa", fontSize: 13}}>
                  {r.student?.email || studentId} | Mentor: {mentorName}
                </p>
                <p>Amount: ₹{((r.amountPaise || r.amount || 0)/100).toLocaleString("en-IN")} | Reason: {r.reason || "N/A"}</p>
                <p style={{color: statusColor, fontWeight: 700}}>Status: {r.status}</p>
              </div>
              <div style={{display: "flex", gap: 8}}>
                <div style={{display: "flex", gap: 8}}>
  <button className="primary-btn" onClick={() => handleAction(r._id, "approve")}>Approve</button>
  <button style={{background: "#f87171", color: "#fff", border: "none", padding: "8px 14px", borderRadius: 8}} onClick={() => handleAction(r._id, "reject")}>Reject</button>
</div>
              </div>
            </div>
          );
        })}
      </main>
    </div>
  );
}
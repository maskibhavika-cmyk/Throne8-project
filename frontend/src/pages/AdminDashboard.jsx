import { NavLink } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";
import "./AdminDashboard.css";

function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");

    axios
      .get("http://localhost:5000/api/v1/admin/stats", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((response) => {
  console.log("Admin stats:", response.data.stats);
  setStats(response.data.stats);
})
      .catch((err) =>
        setError(
          err.response?.data?.message ||
            "Could not load admin statistics"
        )
      )
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <h2 className="admin-message">Loading dashboard...</h2>;
  if (error) return <p className="admin-error">{error}</p>;

  const cards = [
    { title: "Total Users", value: stats.totalUsers, icon: "👥", color: "blue" },
    { title: "Total Bookings", value: stats.totalBookings, icon: "📅", color: "purple" },
    { title: "Total Payments", value: stats.totalPayments, icon: "💳", color: "orange" },
    { title: "Successful Payments", value: stats.successfulPayments, icon: "✅", color: "green" },
    {
      title: "Paid Amount",
     value: `₹${(stats.totalRevenue ?? stats.totalReverificationStatusenue ?? 0).toLocaleString("en-IN")}`,
      color: "pink",
    },
  ];

  return (
    <div className="admin-layout">
    
    
<aside className="admin-sidebar">
  <h2 className="admin-logo">♛ THRONE8</h2>
  <p className="sidebar-label">MAIN MENU</p>

  <NavLink
    to="/admin-dashboard"
    end
    className={({ isActive }) =>
      isActive ? "sidebar-link active" : "sidebar-link"
    }
  >
    ▦ &nbsp; Dashboard
  </NavLink>

  <NavLink
    to="/admin-users"
    className={({ isActive }) =>
      isActive ? "sidebar-link active" : "sidebar-link"
    }
  >
    👥 &nbsp; Users
  </NavLink>

  <NavLink
    to="/admin-bookings"
    className={({ isActive }) =>
      isActive ? "sidebar-link active" : "sidebar-link"
    }
  >
    📅 &nbsp; Bookings
  </NavLink>

  <NavLink
    to="/admin-payments"
    className={({ isActive }) =>
      isActive ? "sidebar-link active" : "sidebar-link"
    }
  >
    💳 &nbsp; Payments
  </NavLink>
  <NavLink
    to="/admin-finance"
    className={({ isActive }) =>
      isActive ? "sidebar-link active" : "sidebar-link"
    }
  >
    💰 &nbsp; Finance
  </NavLink>
  <NavLink
    to="/admin-earnings-queue"
    className={({ isActive }) =>
      isActive ? "sidebar-link active" : "sidebar-link"
    }
  >
    ⏳ &nbsp; Earnings Queue
  </NavLink>
  <NavLink
    to="/admin-refunds"
    className={({ isActive }) =>
      isActive ? "sidebar-link active" : "sidebar-link"
    }
  >
    ↩️ &nbsp; Refunds
  </NavLink>

  <div className="sidebar-bottom">Admin Panel</div>
</aside>



      <main className="admin-main">
        <header className="admin-header">
          <div>
            <p className="admin-eyebrow">OVERVIEW</p>
            <h1>Admin Dashboard</h1>
            <p className="admin-subtitle">
              Welcome back! Here's what's happening on THRONE8.
            </p>
          </div>

          <div className="admin-profile">
            <div className="profile-avatar">A</div>
            <div>
              <strong>Administrator</strong>
              <span>Super Admin</span>
            </div>
          </div>
        </header>

        <section className="welcome-banner">
          <div>
            <p>THRONE8 CONTROL CENTER</p>
            <h2>Manage your platform with ease.</h2>
            <span>Here's your platform's current performance.</span>
          </div>
          <div className="banner-icon">📊</div>
        </section>

        <section className="stats-section">
          <div className="section-heading">
            <h2>Platform Statistics</h2>
            <span>Live data from your database</span>
          </div>

          <div className="stats-grid">
            {cards.map((card) => (
              <div className="stat-card" key={card.title}>
                <div className={`stat-icon ${card.color}`}>
                  {card.icon}
                </div>
                <p>{card.title}</p>
                <h2>{card.value}</h2>
                <span className="stat-footer">THRONE8 overview</span>
              </div>
            ))}
          </div>
        </section>

        <footer className="admin-footer">
          THRONE8 Admin Panel <span>•</span> Platform Overview
        </footer>
      </main>
    </div>
  );
}

export default AdminDashboard;


import {
  BrowserRouter,
  Routes,
  Route,
  Link,
  Navigate,
  useNavigate,
} from "react-router-dom";

import { useEffect, useState } from "react";

import Bookings from "./pages/mentor/Bookings";
import Payment from "./pages/Payment";
import Login from "./pages/Login";
import Register from "./pages/Register";
import AdminDashboard from "./pages/AdminDashboard";
import Users from "./pages/Users";
import AdminBookings from "./pages/AdminBookings";
import Payments from "./pages/Payments";
import Earnings from "./pages/mentor/Earnings";
import Payouts from "./pages/mentor/Payouts";
import AdminFinance from "./pages/AdminFinance";
import AdminEarningsQueue from "./pages/AdminEarningsQueue";
import AdminRefunds from "./pages/AdminRefunds";
import Notifications from "./pages/Notifications";

import "./App.css";

const API = "http://localhost:5000/api/v1";

function Navbar() {
  const user = JSON.parse(localStorage.getItem("user") || "null");
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user || !localStorage.getItem("token")) {
  return;
}
    let active = true;

    const fetchUnreadCount = async () => {
      try {
        const response = await fetch(`${API}/notifications`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });

        const data = await response.json();

        if (active && response.ok && data.success) {
          setUnreadCount(data.unreadCount || 0);
        }
      } catch (error) {
        console.error("Notification count error:", error);
      }
    };

    fetchUnreadCount();

    const interval = setInterval(fetchUnreadCount, 30000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [user?.role]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <nav className="navbar">
      <Link className="logo" to="/">
        THRONE8
      </Link>

      <div className="nav-links">
        <Link to="/">Home</Link>

        {!user ? (
          <>
            <Link to="/login">Login</Link>
            <Link to="/register">Register</Link>
          </>
        ) : (
          <>
            {user.role === "student" && (
              <Link to="/student-dashboard">Dashboard</Link>
            )}

            {user.role === "mentor" && (
              <>
                <Link to="/mentor-dashboard">Dashboard</Link>
                <Link to="/mentor-bookings">Bookings</Link>
                <Link to="/mentor-earnings">Earnings</Link>
                <Link to="/mentor-payouts">Payouts</Link>
              </>
            )}

            {user.role === "admin" && (
              <Link to="/admin-dashboard">Dashboard</Link>
            )}

            <Link to="/notifications" className="notification-nav">
              🔔 Notifications
              {unreadCount > 0 && (
                <span className="notification-badge">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </Link>

            <button onClick={handleLogout}>Logout</button>
          </>
        )}

        <a href="/#about">About</a>
      </div>
    </nav>
  );
}

function Home() {
  return (
    <div className="app">
      <Navbar />

      <section className="hero" id="home">
        <p className="tagline">YOUR CAREER. YOUR FUTURE.</p>
        <h1>
          Learn from Experts.
          <br />
          Grow with Mentors.
        </h1>

        <p className="hero-text">
          Connect with experienced mentors, book one-to-one sessions,
          and take the next step in your career.
        </p>

        <Link className="primary-btn" to="/student-dashboard">
          Open Dashboard
        </Link>

        <p>
          <a href="#payment">Book a Session</a>
        </p>
      </section>

      <section className="features" id="about">
        <h2>Why Choose THRONE8?</h2>

        <div className="feature-grid">
          <article className="feature-card">
            <h3>Expert Mentors</h3>
            <p>
              Learn from experienced professionals and get career guidance.
            </p>
          </article>

          <article className="feature-card">
            <h3>Easy Booking</h3>
            <p>Book your mentorship session through a simple process.</p>
          </article>

          <article className="feature-card">
            <h3>Secure Payments</h3>
            <p>
              Pay for your session and view your booking confirmation.
            </p>
          </article>
        </div>
      </section>

      <section className="payment-section" id="payment">
        <h2>Book Your Mentorship Session</h2>
        <Payment />
      </section>

      <footer className="footer">
        © 2026 THRONE8. All rights reserved.
      </footer>
    </div>
  );
}

function Dashboard({ role, title, description }) {
  const user = JSON.parse(localStorage.getItem("user") || "null");
  const token = localStorage.getItem("token");

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== role) {
    if (user.role === "mentor") {
      return <Navigate to="/mentor-dashboard" replace />;
    }

    if (user.role === "admin") {
      return <Navigate to="/admin-dashboard" replace />;
    }

    return <Navigate to="/student-dashboard" replace />;
  }

  return (
    <div className="app">
      <Navbar />

      <div className="auth-page">
        <div className="auth-card">
          <h1>{title}</h1>
          <p>Welcome, {user.name || role}!</p>
          <p>{description}</p>
          <p>Email: {user.email}</p>
          <p>Account Role: {user.role}</p>

          {role === "student" && (
            <Link className="primary-btn" to="/#payment">
              Book a Session
            </Link>
          )}

          <p>
            <Link to="/">Go to Home</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

function ProtectedAdminRoute({ children }) {
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "null");

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== "admin") {
    return <Navigate to="/" replace />;
  }

  return children;
}

function ProtectedMentorPage({ children }) {
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "null");

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== "mentor") {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="app">
      <Navbar />
      {children}
    </div>
  );
}

function ProtectedNotificationsPage() {
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "null");

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="app">
      <Navbar />
      <Notifications />
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route
          path="/student-dashboard"
          element={
            <Dashboard
              role="student"
              title="Student Dashboard"
              description="Explore mentorship and book your sessions."
            />
          }
        />

        <Route
          path="/mentor-dashboard"
          element={
            <Dashboard
              role="mentor"
              title="Mentor Dashboard"
              description="Manage your mentorship sessions."
            />
          }
        />

        <Route
          path="/notifications"
          element={<ProtectedNotificationsPage />}
        />

        <Route
          path="/mentor-earnings"
          element={
            <ProtectedMentorPage>
              <Earnings />
            </ProtectedMentorPage>
          }
        />

        <Route
          path="/mentor-payouts"
          element={
            <ProtectedMentorPage>
              <Payouts />
            </ProtectedMentorPage>
          }
        />

        <Route
          path="/admin-dashboard"
          element={
            <ProtectedAdminRoute>
              <AdminDashboard />
            </ProtectedAdminRoute>
          }
        />

        <Route
          path="/admin-users"
          element={
            <ProtectedAdminRoute>
              <Users />
            </ProtectedAdminRoute>
          }
        />

        <Route
          path="/admin-bookings"
          element={
            <ProtectedAdminRoute>
              <div className="app">
                <Navbar />
                <AdminBookings />
              </div>
            </ProtectedAdminRoute>
          }
        />

        <Route
          path="/admin-payments"
          element={
            <ProtectedAdminRoute>
              <Payments />
            </ProtectedAdminRoute>
          }
        />

        <Route
          path="/admin-finance"
          element={
            <ProtectedAdminRoute>
              <AdminFinance />
            </ProtectedAdminRoute>
          }
        />

        <Route
          path="/admin-earnings-queue"
          element={
            <ProtectedAdminRoute>
              <AdminEarningsQueue />
            </ProtectedAdminRoute>
          }
        />

        <Route
          path="/admin-refunds"
          element={
            <ProtectedAdminRoute>
              <AdminRefunds />
            </ProtectedAdminRoute>
          }
        />

        <Route
          path="/mentor-bookings"
          element={
            <ProtectedMentorPage>
              <Bookings />
            </ProtectedMentorPage>
          }
        />

        <Route
          path="*"
          element={
            <h1 style={{ padding: 50 }}>
              404 - Route match nahi hua: URL dekho
            </h1>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

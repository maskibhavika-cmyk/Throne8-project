
import {
  BrowserRouter,
  Routes,
  Route,
  Link,
  Navigate,
  useNavigate,
} from "react-router-dom";

import Payment from "./pages/Payment";
import Login from "./pages/Login";
import Register from "./pages/Register";
import AdminDashboard from "./pages/AdminDashboard";
import "./App.css";
import Users from "./pages/Users";
import Bookings from "./pages/Bookings";
import Payments from "./pages/Payments";

function Navbar() {
  const user = JSON.parse(localStorage.getItem("user") || "null");
  
  const navigate = useNavigate();

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
              <Link to="/mentor-dashboard">Dashboard</Link>
            )}

            {user.role === "admin" && (
              <Link to="/admin-dashboard">Dashboard</Link>
            )}

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
            <p>
              Book your mentorship session through a simple process.
            </p>
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
      <Bookings />
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


        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

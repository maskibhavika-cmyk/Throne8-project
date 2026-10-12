
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

function Register() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "student",
  });

  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setIsLoading(true);

    try {
      const response = await axios.post(
        "http://localhost:5000/api/v1/auth/register",
        form
      );

      setMessage(
        response.data.message || "Registration successful! Redirecting to login..."
      );

      setTimeout(() => navigate("/login"), 1500);
    } catch (error) {
      setMessage(
        error.response?.data?.message ||
          "Registration failed. Please check your connection and try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <form className="auth-card register-card" onSubmit={handleSubmit}>
        <div className="register-heading">
          <span className="register-tagline">THRONE8 MENTORSHIP</span>
          <h1>Create Account</h1>
          <p>Join the THRONE8 mentorship platform</p>
        </div>

        <div className="register-field">
          <label htmlFor="name">Full Name</label>
          <input
            id="name"
            type="text"
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="Enter your full name"
            autoComplete="name"
            required
          />
        </div>

        <div className="register-field">
          <label htmlFor="email">Email Address</label>
          <input
            id="email"
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            placeholder="Enter your email"
            autoComplete="email"
            required
          />
        </div>

        <div className="register-field">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            name="password"
            minLength={8}
            value={form.password}
            onChange={handleChange}
            placeholder="Minimum 8 characters"
            autoComplete="new-password"
            required
          />
          <span className="register-hint">
            Password must contain at least 8 characters.
          </span>
        </div>

        <div className="register-field">
          <label htmlFor="role">Register As</label>
          <select
            id="role"
            name="role"
            value={form.role}
            onChange={handleChange}
          >
            <option value="student">Student</option>
            <option value="mentor">Mentor</option>
          </select>
        </div>

        <button
          className="register-submit"
          type="submit"
          disabled={isLoading}
        >
          {isLoading ? "Creating Account..." : "Create Account"}
        </button>

        {message && (
          <p className="register-message" role="status">
            {message}
          </p>
        )}

        <div className="register-login">
          <span>Already registered?</span>{" "}
          <Link to="/login">Login</Link>
        </div>
      </form>
    </div>
  );
}

export default Register;

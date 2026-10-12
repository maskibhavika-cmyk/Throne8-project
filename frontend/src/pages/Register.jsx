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
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    try {
      const response = await axios.post(
        "http://localhost:5000/api/v1/auth/register",
        form
      );

      setMessage(response.data.message || "Registration successful!");
      setTimeout(() => navigate("/login"), 1000);
    } catch (error) {
      setMessage(
        error.response?.data?.message || "Registration failed. Check backend."
      );
    }
  };

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit}>
        <h1>Create Account</h1>
        <p>Join the THRONE8 mentorship platform</p>

        <label>Full Name</label>
        <input
          name="name"
          value={form.name}
          onChange={handleChange}
          required
        />

        <label>Email</label>
        <input
          type="email"
          name="email"
          value={form.email}
          onChange={handleChange}
          required
        />

        <label>Password (minimum 8 characters)</label>
        <input
          type="password"
          name="password"
          minLength={8}
          value={form.password}
          onChange={handleChange}
          required
        />

        <label>Register As</label>
        <select name="role" value={form.role} onChange={handleChange}>
          <option value="student">Student</option>
          <option value="mentor">Mentor</option>
        </select>

        <button type="submit">Create Account</button>
        {message && <p role="status">{message}</p>}

        <p>Already registered? <Link to="/login">Login</Link></p>
      </form>
    </div>
  );
}

export default Register;
import React, { useState } from "react";
import { MapPin, Lock, User } from "lucide-react";
import API, { setToken } from "../api";

export default function Login({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function login(e) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await API.post("/auth/login", { username, password });
      const { token, user } = res.data;

      // Store token in localStorage first
      localStorage.setItem("token", token);
      setToken(token);

      // Store username
      if (user && user.username) {
        localStorage.setItem("username", user.username);
      }

      onLogin(token);
    } catch (e) {
      setError("Login failed: " + (e.response?.data?.error || e.message));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="admin-login-container">
      <div className="admin-login-card">
        {/* Header */}
        <div className="admin-login-header">
          <div className="admin-login-logo">
            <MapPin size={32} />
            <h1>BikeRental Admin</h1>
          </div>
          <p className="admin-login-subtitle">Sign in to your admin account</p>
        </div>

        {/* Error Message */}
        {error && <div className="admin-login-error">{error}</div>}

        {/* Login Form */}
        <form onSubmit={login} className="admin-login-form">
          <div className="admin-input-group">
            <label htmlFor="username">Username</label>
            <div className="admin-input-with-icon">
              <User size={20} className="admin-input-icon" />
              <input
                id="username"
                type="text"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="admin-input"
                required
              />
            </div>
          </div>

          <div className="admin-input-group">
            <label htmlFor="password">Password</label>
            <div className="admin-input-with-icon">
              <Lock size={20} className="admin-input-icon" />
              <input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="admin-input"
                required
              />
            </div>
          </div>

          <button type="submit" className="admin-login-btn" disabled={loading}>
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        {/* Footer */}
        <div className="admin-login-footer">
          <p>BikeRental Management System</p>
        </div>
      </div>
    </div>
  );
}

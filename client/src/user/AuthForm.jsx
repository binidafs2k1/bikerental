import React, { useState } from "react";
import { MapPin, Lock, User } from "lucide-react";
import API, { setToken } from "../api";

export default function AuthForm({ onLogin }) {
  const [isLogin, setIsLogin] = useState(true); // true for login, false for register
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (isLogin) {
        // Login
        const res = await API.post("/auth/login", { username, password });
        const { token, user } = res.data;
        localStorage.setItem("token", token);
        setToken(token);
        if (user && user.username) {
          localStorage.setItem("username", user.username);
        }
        onLogin(token);
      } else {
        // Register
        await API.post("/auth/register", { username, password });
        // Auto-login after register
        const res = await API.post("/auth/login", { username, password });
        const { token, user } = res.data;
        localStorage.setItem("token", token);
        setToken(token);
        if (user && user.username) {
          localStorage.setItem("username", user.username);
        }
        onLogin(token);
      }
    } catch (e) {
      setError(
        (isLogin ? "Login" : "Registration") +
          " failed: " +
          (e.response?.data?.error || e.message)
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="user-login-container">
      <div className="user-login-card">
        {/* Header */}
        <div className="user-login-header">
          <div className="user-login-logo">
            <MapPin size={32} />
            <h1>BikeShare</h1>
          </div>
          <p className="user-login-subtitle">
            {isLogin ? "Sign in to your account" : "Create your account"}
          </p>
        </div>

        {/* Error Message */}
        {error && <div className="user-login-error">{error}</div>}

        {/* Form */}
        <form onSubmit={handleSubmit} className="user-login-form">
          <div className="user-input-group">
            <label htmlFor="username">Username</label>
            <div className="user-input-with-icon">
              <User size={20} className="user-input-icon" />
              <input
                id="username"
                type="text"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="user-input"
                required
              />
            </div>
          </div>

          <div className="user-input-group">
            <label htmlFor="password">Password</label>
            <div className="user-input-with-icon">
              <Lock size={20} className="user-input-icon" />
              <input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="user-input"
                required
              />
            </div>
          </div>

          <button type="submit" className="user-login-btn" disabled={loading}>
            {loading
              ? isLogin
                ? "Signing in..."
                : "Creating account..."
              : isLogin
              ? "Sign In"
              : "Create Account"}
          </button>
        </form>

        {/* Toggle */}
        <div className="user-auth-toggle">
          <p>
            {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
            <button
              type="button"
              className="user-toggle-btn"
              onClick={() => setIsLogin(!isLogin)}
            >
              {isLogin ? "Register" : "Login"}
            </button>
          </p>
        </div>

        {/* Footer */}
        <div className="user-login-footer">
          <p>BikeShare User Portal</p>
        </div>
      </div>
    </div>
  );
}

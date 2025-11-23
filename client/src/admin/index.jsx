// Admin App Entry - Router wrapper
import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import AdminLayout from "./AdminLayout";
import Profile from "../shared/Profile";
import Visualization from "../shared/Visualization";
import AdminDashboard from "../shared/AdminDashboard";
import AdminUsers from "../shared/AdminUsers";
import AdminStations from "../shared/AdminStations";
import AdminReports from "../shared/AdminReports";
import AdminPosts from "../shared/AdminPosts";
import Login from "../shared/Login";
import "./admin.css";

export default function AdminIndex({
  token,
  setToken,
  username,
  setUsername,
  onLogout,
}) {
  const handleLogin = (newToken) => {
    setToken(newToken);
  };

  const handleLogout = () => {
    if (onLogout) onLogout();
  };

  if (!token) {
    return (
      <div className="admin-layout">
        <Router>
          <div
            className="admin-content"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              minHeight: "100vh",
              background: "var(--gray-50)",
            }}
          >
            <Routes>
              {/* Support both standalone (/) and nested (/admin) dev usage */}
              <Route
                path="/admin/login"
                element={<Login onLogin={handleLogin} />}
              />
              <Route path="/login" element={<Login onLogin={handleLogin} />} />
              <Route path="*" element={<Navigate to="/admin/login" />} />
            </Routes>
          </div>
        </Router>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        {/* Support both /admin parent (nested) and / parent (standalone dev server) */}
        <Route
          path="/admin"
          element={
            <AdminLayout
              username={username || localStorage.getItem("username")}
              onLogout={handleLogout}
            />
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="stations" element={<AdminStations />} />
          <Route path="reports" element={<AdminReports />} />
          <Route path="posts" element={<AdminPosts />} />
          <Route path="profile" element={<Profile />} />
          <Route path="visualization" element={<Visualization />} />
          <Route path="*" element={<Navigate to="/admin" />} />
        </Route>

        <Route
          path="/"
          element={
            <AdminLayout
              username={username || localStorage.getItem("username")}
              onLogout={handleLogout}
            />
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="stations" element={<AdminStations />} />
          <Route path="reports" element={<AdminReports />} />
          <Route path="posts" element={<AdminPosts />} />
          <Route path="profile" element={<Profile />} />
          <Route path="visualization" element={<Visualization />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Route>
      </Routes>
    </Router>
  );
}

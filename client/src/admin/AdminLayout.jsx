import React, { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import {
  LayoutDashboard,
  MapPin,
  FileText,
  MessageSquare,
  Users,
  Settings,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import "./admin.css";

export default function AdminLayout({ username, onLogout }) {
  // active tab is determined by the route path now (NavLink + Outlet)
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const logout = () => {
    if (onLogout) {
      onLogout();
    } else {
      localStorage.removeItem("token");
      localStorage.removeItem("isAdmin");
      localStorage.removeItem("username");
      // If we don't have parent logout handler, go to the admin login screen
      window.location.href = "/admin/login";
    }
  };

  const menuItems = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: <LayoutDashboard size={20} />,
    },
    {
      id: "users",
      label: "Users",
      icon: <Users size={20} />,
    },
    {
      id: "stations",
      label: "Stations",
      icon: <MapPin size={20} />,
    },
    {
      id: "reports",
      label: "Reports",
      icon: <FileText size={20} />,
    },
    {
      id: "posts",
      label: "Posts",
      icon: <MessageSquare size={20} />,
    },
  ];

  // The content for each admin page is now rendered by nested routes via <Outlet />

  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <div className={`admin-sidebar ${sidebarOpen ? "show" : ""}`}>
        <div className="admin-sidebar-header">
          <div className="admin-logo">
            <MapPin size={24} />
            BikeRental Admin
          </div>
          {username && (
            <div
              style={{
                fontSize: "0.875rem",
                color: "var(--gray-600)",
                marginTop: "0.5rem",
              }}
            >
              Welcome, {username}
            </div>
          )}
        </div>

        <nav className="admin-nav">
          {menuItems.map((item) => (
            <NavLink
              key={item.id}
              // Use relative paths so the layout works both when mounted at /admin
              // (nested under main app) and when served standalone at root (/).
              to={item.id === "dashboard" ? "." : item.id}
              className={({ isActive }) =>
                `admin-nav-item ${isActive ? "active" : ""}`
              }
              end={item.id === "dashboard"}
            >
              {item.icon}
              {item.label}
            </NavLink>
          ))}

          <div style={{ marginTop: "auto", paddingTop: "2rem" }}>
            <button onClick={logout} className="admin-nav-item">
              <LogOut size={20} />
              Logout
            </button>
          </div>
        </nav>
      </div>

      {/* Main Content */}
      <div className="admin-main">
        {/* Mobile Header */}
        <div
          className="admin-mobile-header"
          style={{
            display: "none",
            padding: "1rem",
            background: "white",
            borderBottom: "1px solid var(--gray-200)",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="admin-btn admin-btn-ghost"
          >
            <Menu size={20} />
          </button>
          <div className="admin-logo">BikeRental Admin</div>
        </div>

        <div className="admin-content">
          {/* Render matching route content */}
          <Outlet />
        </div>
      </div>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="admin-sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
          style={{
            display: "none",
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.5)",
            zIndex: 99,
          }}
        />
      )}
    </div>
  );
}

import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  NavLink,
  Link,
  Navigate,
} from "react-router-dom";
import {
  LayoutDashboard,
  MapPin,
  MessageSquare,
  FileText,
  Bike,
  User,
  BarChart3,
  LogOut,
} from "lucide-react";
import Stations from "../shared/Stations";
import Posts from "../shared/Posts";
import ReportForm from "../shared/ReportForm";
import Rentals from "../shared/Rentals";
import Profile from "../shared/Profile";
import AuthForm from "./AuthForm";

const navLinks = [
  { label: "Home", path: "/home", icon: <LayoutDashboard size={18} /> },
  { label: "Posts", path: "/posts", icon: <MessageSquare size={18} /> },
  { label: "Report", path: "/report", icon: <FileText size={18} /> },
  { label: "My Rentals", path: "/rentals", icon: <Bike size={18} /> },
  { label: "Profile", path: "/profile", icon: <User size={18} /> },
];

export default function UserIndex({ token, setToken, username, onLogout }) {
  const handleLogin = (newToken) => {
    setToken(newToken);
  };

  const handleLogout = () => {
    if (onLogout) onLogout();
  };

  if (!token) {
    return (
      <Router>
        <AuthForm onLogin={handleLogin} />
      </Router>
    );
  }

  return (
    <Router>
      <div className="user-layout">
        <aside className="user-sidebar">
          <div className="user-sidebar__header">
            <div className="user-sidebar__logo">
              <div>
                <div className="app-title">BikeShare</div>
                <p className="user-sidebar__welcome-text">
                  {username ? `Welcome, ${username}` : "Hello Rider"}
                </p>
              </div>
            </div>
          </div>
          <nav className="user-sidebar__nav">
            {navLinks.map((link) => (
              <NavLink
                key={link.path}
                to={link.path}
                className={({ isActive }) =>
                  `user-sidebar-link${
                    isActive ? " user-sidebar-link--active" : ""
                  }`
                }
              >
                <span className="user-sidebar-link-icon">{link.icon}</span>
                <span>{link.label}</span>
              </NavLink>
            ))}
          </nav>
          <button
            type="button"
            className="user-sidebar__logout"
            onClick={handleLogout}
          >
            <span className="user-sidebar__logout-icon">
              <LogOut size={16} />
            </span>
            <span>Logout</span>
          </button>
        </aside>
        <div className="user-main">
          <main className="user-main__content container">
            <Routes>
              <Route path="/" element={<Navigate to="/home" replace />} />
              <Route path="/home" element={<Stations />} />
              <Route path="/posts" element={<Posts />} />
              <Route path="/report" element={<ReportForm />} />
              <Route path="/rentals" element={<Rentals />} />
              <Route path="/profile" element={<Profile />} />
              <Route
                path="/stations"
                element={<Navigate to="/home" replace />}
              />
              <Route path="/login" element={<Navigate to="/home" replace />} />
              <Route
                path="/register"
                element={<Navigate to="/home" replace />}
              />
              <Route path="*" element={<Navigate to="/home" replace />} />
            </Routes>
          </main>
        </div>
      </div>
    </Router>
  );
}

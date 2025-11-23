import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  NavLink,
  Navigate,
} from "react-router-dom";
import Login from "./pages/Login";
import Stations from "./pages/Stations";
import AdminIndex from "./admin/index";
import Register from "./pages/Register";
import Profile from "./pages/Profile";
import Posts from "./pages/Posts";
import ReportForm from "./pages/ReportForm";
import Visualization from "./pages/Visualization";
import MapView from "./pages/MapView";
import Rentals from "./pages/Rentals";
import { setToken } from "./api";
import API from "./api";

export default function App() {
  const [token, setTok] = useState(localStorage.getItem("token"));
  const [username, setUsername] = useState("");

  useEffect(() => {
    setToken(token);
    if (token) loadProfile();
    else setUsername("");
  }, [token]);

  async function loadProfile() {
    try {
      const res = await API.get("/profile");
      setUsername(res.data.username);
    } catch (e) {
      setUsername("");
    }
  }

  function handleLogin(t) {
    localStorage.setItem("token", t);
    setTok(t);
  }

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("isAdmin");
    localStorage.removeItem("username");
    setTok(null);
    setToken(null);
  }

  return (
    <Router>
      <div>
        <header className="app-header">
          <div className="app-title">따릉이 - BikeShare</div>
          <div className="nav container">
            {!token && (
              <Link to="/login" className="btn">
                Login
              </Link>
            )}
            {!token && (
              <Link to="/register" className="btn secondary">
                Register
              </Link>
            )}
            {token && (
              <NavLink to="/stations" className="btn">
                Stations
              </NavLink>
            )}
            {token && (
              <NavLink to="/map" className="btn">
                Map
              </NavLink>
            )}
            {token && (
              <NavLink to="/posts" className="btn">
                Posts
              </NavLink>
            )}
            {token && (
              <NavLink to="/report" className="btn">
                Report
              </NavLink>
            )}
            {token && (
              <NavLink to="/rentals" className="btn">
                My Rentals
              </NavLink>
            )}
            {token && (
              <NavLink to="/profile" className="btn">
                Profile
              </NavLink>
            )}
            {token && (
              <NavLink to="/visualization" className="btn">
                Visualization
              </NavLink>
            )}
            {token && localStorage.getItem("isAdmin") === "true" && (
              <Link to="/admin" className="btn">
                Admin
              </Link>
            )}
            {token && (
              <button
                className="btn ghost"
                onClick={() => {
                  logout();
                  // ensure we land on the home screen after logout
                  window.location.href = "/";
                }}
              >
                Logout
              </button>
            )}
            {token && <div className="muted small right">{username}</div>}
          </div>
        </header>

        <main className="container">
          <AppRoutes
            token={token}
            onLogin={handleLogin}
            onRegister={handleLogin}
            logout={logout}
            username={username}
            setUsername={setUsername}
            setTok={setTok}
          />
        </main>
      </div>
    </Router>
  );
}

function AppRoutes({
  token,
  onLogin,
  onRegister,
  logout,
  username,
  setUsername,
  setTok,
}) {
  // small wrapper component so pages can use react-router's hooks
  return (
    <Routes>
      <Route
        path="/"
        element={
          !token ? (
            <div className="card">
              <h2>Welcome to Bike Rental</h2>
              <p className="muted">Please Login or Register to continue.</p>
            </div>
          ) : (
            <Stations />
          )
        }
      />
      <Route path="/login" element={<Login onLogin={onLogin} />} />
      <Route path="/register" element={<Register onRegister={onRegister} />} />

      <Route
        path="/stations"
        element={token ? <Stations /> : <Navigate to="/login" />}
      />
      <Route
        path="/map"
        element={token ? <MapView /> : <Navigate to="/login" />}
      />
      <Route
        path="/posts"
        element={token ? <Posts /> : <Navigate to="/login" />}
      />
      <Route
        path="/report"
        element={token ? <ReportForm /> : <Navigate to="/login" />}
      />
      <Route
        path="/rentals"
        element={token ? <Rentals /> : <Navigate to="/login" />}
      />
      <Route
        path="/profile"
        element={token ? <Profile /> : <Navigate to="/login" />}
      />
      <Route
        path="/visualization"
        element={token ? <Visualization /> : <Navigate to="/login" />}
      />

      <Route
        path="/admin/*"
        element={
          token ? (
            <AdminIndex
              token={token}
              setToken={setTok}
              username={username}
              setUsername={setUsername}
              onLogout={logout}
            />
          ) : (
            <Navigate to="/admin/login" />
          )
        }
      />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

// end App

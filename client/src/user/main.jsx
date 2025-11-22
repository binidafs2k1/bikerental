import React, { useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import UserIndex from "./index";
import { setToken as setAPIToken } from "../api";
import "../style.css";

const root = createRoot(document.getElementById("root"));

function Root() {
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [username, setUsername] = useState(
    localStorage.getItem("username") || ""
  );

  useEffect(() => {
    if (token) {
      setAPIToken(token);
      // Fetch user info if we have token
      fetchUserInfo();
    }
  }, [token]);

  async function fetchUserInfo() {
    try {
      const API = (await import("../api")).default;
      const res = await API.get("/profile");
      setUsername(res.data.username);
      localStorage.setItem("username", res.data.username);
    } catch (e) {
      // If token is invalid, clear it
      handleLogout();
    }
  }

  function handleSetToken(newToken) {
    setToken(newToken);
    localStorage.setItem("token", newToken);
    setAPIToken(newToken);
  }

  function handleLogout() {
    setToken(null);
    setUsername("");
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    setAPIToken(null);
  }

  return (
    <UserIndex
      token={token}
      setToken={handleSetToken}
      username={username}
      setUsername={setUsername}
      onLogout={handleLogout}
    />
  );
}

root.render(<Root />);

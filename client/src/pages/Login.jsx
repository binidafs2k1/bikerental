import React, { useState } from "react";
import API, { setToken } from "../api";

export default function Login({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  async function login(e) {
    e.preventDefault();
    const res = await API.post("/auth/login", { username, password });
    const { token } = res.data;
    setToken(token);
    onLogin(token);
  }

  return (
    <div className="card">
      <h3>Login</h3>
      <form onSubmit={login}>
        <div>
          <input
            placeholder="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </div>
        <div>
          <input
            placeholder="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <button type="submit">Login</button>
      </form>
    </div>
  );
}

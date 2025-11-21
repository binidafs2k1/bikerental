import React, { useState } from 'react'
import API, { setToken } from '../api'

export default function Register({ onRegister }){
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')

  async function register(e){
    e.preventDefault();
    await API.post('/auth/register', { username, password });
    // auto-login
    const res = await API.post('/auth/login', { username, password });
    const { token } = res.data;
    setToken(token);
    onRegister(token);
  }

  return (
    <div className="card">
      <h3>Register</h3>
      <form onSubmit={register}>
        <div><input placeholder="username" value={username} onChange={e=>setUsername(e.target.value)} /></div>
        <div><input placeholder="password" type="password" value={password} onChange={e=>setPassword(e.target.value)} /></div>
        <button type="submit">Register</button>
      </form>
    </div>
  )
}

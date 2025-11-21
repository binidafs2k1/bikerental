import React, { useEffect, useState } from 'react'
import API from '../api'

export default function Profile(){
  const [profile, setProfile] = useState(null)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')

  useEffect(()=>{ fetchProfile() }, [])
  async function fetchProfile(){
    const res = await API.get('/profile');
    setProfile(res.data);
    setUsername(res.data.username);
  }

  async function save(e){
    e.preventDefault();
    await API.put('/profile', { username, password: password || undefined });
    alert('Saved');
    setPassword('');
    fetchProfile();
  }

  if (!profile) return <div>Loading...</div>

  return (
    <div className="card">
      <h3>Profile</h3>
      <form onSubmit={save}>
        <div><input value={username} onChange={e=>setUsername(e.target.value)} /></div>
        <div><input placeholder="new password (leave blank to keep)" type="password" value={password} onChange={e=>setPassword(e.target.value)} /></div>
        <button type="submit">Save</button>
      </form>
    </div>
  )
}

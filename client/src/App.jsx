import React, { useState, useEffect } from 'react'
import Login from './pages/Login'
import Stations from './pages/Stations'
import AdminDashboard from './pages/AdminDashboard'
import Register from './pages/Register'
import Profile from './pages/Profile'
import Posts from './pages/Posts'
import ReportForm from './pages/ReportForm'
import Visualization from './pages/Visualization'
import MapView from './pages/MapView'
import Rentals from './pages/Rentals'
import { setToken } from './api'

export default function App(){
  const [token, setTok] = useState(localStorage.getItem('token'))
  const [page, setPage] = useState('home')
  useEffect(()=> setToken(token), [token])

  function handleLogin(t){
    localStorage.setItem('token', t)
    setTok(t)
    setPage('home')
  }

  function logout(){
    localStorage.removeItem('token')
    setTok(null)
    setPage('home')
    setToken(null)
  }

  return (
    <div>
      <div className="nav">
        {!token && <button onClick={()=>setPage('login')}>Login</button>}
        {!token && <button onClick={()=>setPage('register')}>Register</button>}
        {token && <button onClick={()=>setPage('stations')}>Stations</button>}
        {token && <button onClick={()=>setPage('map')}>Map</button>}
        {token && <button onClick={()=>setPage('posts')}>Posts</button>}
        {token && <button onClick={()=>setPage('report')}>Report</button>}
        {token && <button onClick={()=>setPage('rentals')}>My Rentals</button>}
        {token && <button onClick={()=>setPage('profile')}>Profile</button>}
        {token && <button onClick={()=>setPage('visual')}>Visualization</button>}
        {token && <button onClick={()=>setPage('admin')}>Admin</button>}
        {token && <button onClick={logout}>Logout</button>}
      </div>

      {!token && page === 'login' && <Login onLogin={handleLogin} />}
      {!token && page === 'register' && <Register onRegister={handleLogin} />}

      {token && page === 'stations' && <Stations />}
      {token && page === 'map' && <MapView />}
      {token && page === 'posts' && <Posts />}
      {token && page === 'report' && <ReportForm />}
      {token && page === 'rentals' && <Rentals />}
      {token && page === 'profile' && <Profile />}
      {token && page === 'visual' && <Visualization />}
      {token && page === 'admin' && <AdminDashboard />}

      {!token && page === 'home' && (
        <div>
          <h2>Welcome to Bike Rental</h2>
          <p>Please Login or Register to continue.</p>
        </div>
      )}
    </div>
  )
}

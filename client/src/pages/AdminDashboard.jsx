import React, { useEffect, useState } from "react";
import API from "../api";

export default function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [stations, setStations] = useState([]);
  const [newStation, setNewStation] = useState({ name: '', lat: '', lng: '', capacity: 10, available: 0, open: true });

  useEffect(() => {
    load();
    loadStations();
  }, []);
  async function load() {
    try {
      const res = await API.get("/admin/users");
      setUsers(res.data);
    } catch (e) {
      // ignore if not admin
    }
  }

  async function loadStations(){
    try{
      const res = await API.get('/admin/stations');
      setStations(res.data);
    }catch(e){}
  }

  const [editingId, setEditingId] = useState(null);
  const [editingData, setEditingData] = useState({});

  async function setRole(id, role) {
    await API.put(`/admin/users/${id}/role`, { role });
    load();
  }

  async function createStation(e){
    e.preventDefault();
    try{
      const payload = { name: newStation.name, lat: parseFloat(newStation.lat), lng: parseFloat(newStation.lng), capacity: Number(newStation.capacity), available: Number(newStation.available), open: true };
      await API.post('/admin/stations', payload);
      setNewStation({ name: '', lat: '', lng: '', capacity: 10, available: 0 });
      loadStations();
    }catch(e){ alert('Error creating station') }
  }

  async function changeInventory(id, delta){
    try{
      await API.post(`/admin/stations/${id}/inventory`, { delta });
      loadStations();
    }catch(e){ alert(e.response?.data?.error || 'Error') }
  }

  async function deleteStation(id){
    if(!confirm('Delete station? This action cannot be undone.')) return;
    try{
      await API.delete(`/admin/stations/${id}`);
      loadStations();
    }catch(e){ alert('Error deleting station') }
  }

  async function toggleOpen(id, current){
    try{
      await API.put(`/admin/stations/${id}`, { open: !current });
      loadStations();
    }catch(e){ alert('Error toggling open/closed') }
  }

  function startEdit(s){
    setEditingId(s.id);
    setEditingData({ name: s.name, lat: s.lat, lng: s.lng, capacity: s.capacity, available: s.available, open: !!s.open });
  }

  async function saveEdit(id){
    try{
      await API.put(`/admin/stations/${id}`, editingData);
      setEditingId(null);
      setEditingData({});
      loadStations();
    }catch(e){ alert(e.response?.data?.error || 'Error saving') }
  }

  function cancelEdit(){ setEditingId(null); setEditingData({}) }

  async function setCapacity(id, capacity){
    try{
      await API.post(`/admin/stations/${id}/capacity`, { capacity });
      loadStations();
    }catch(e){ alert('Error') }
  }

  return (
    <div>
      <h3>Admin</h3>
      <div style={{display:'flex', gap:12}}>
        <div style={{flex:1}}>
          <h4>Users</h4>
          {users.map((u) => (
            <div key={u.id} className="card">
              {u.username} - {u.role}
              <div>
                <button onClick={() => setRole(u.id, 'user')}>Set User</button>
                <button onClick={() => setRole(u.id, 'admin')}>Set Admin</button>
              </div>
            </div>
          ))}
        </div>

        <div style={{flex:1}}>
          <h4>Stations</h4>
          <form onSubmit={createStation} className="card">
            <div><input placeholder="Name" value={newStation.name} onChange={e=>setNewStation({...newStation, name: e.target.value})} /></div>
            <div><input placeholder="Latitude" value={newStation.lat} onChange={e=>setNewStation({...newStation, lat: e.target.value})} /></div>
            <div><input placeholder="Longitude" value={newStation.lng} onChange={e=>setNewStation({...newStation, lng: e.target.value})} /></div>
            <div><input placeholder="Capacity" value={newStation.capacity} onChange={e=>setNewStation({...newStation, capacity: e.target.value})} /></div>
            <div><input placeholder="Available" value={newStation.available} onChange={e=>setNewStation({...newStation, available: e.target.value})} /></div>
            <div style={{marginTop:8}}>
              <label><input type="checkbox" checked={!!newStation.open} onChange={e=>setNewStation({...newStation, open: e.target.checked})} /> Open</label>
            </div>
            <button type="submit">Create Station</button>
          </form>

          {stations.map(s=> (
            <div key={s.id} className="card">
              {editingId === s.id ? (
                <div>
                  <div><input value={editingData.name} onChange={e=>setEditingData({...editingData, name: e.target.value})} /></div>
                  <div><input value={editingData.lat} onChange={e=>setEditingData({...editingData, lat: e.target.value})} /></div>
                  <div><input value={editingData.lng} onChange={e=>setEditingData({...editingData, lng: e.target.value})} /></div>
                  <div><input value={editingData.capacity} onChange={e=>setEditingData({...editingData, capacity: e.target.value})} /></div>
                  <div><input value={editingData.available} onChange={e=>setEditingData({...editingData, available: e.target.value})} /></div>
                  <div style={{marginTop:8}}>
                    <label><input type="checkbox" checked={!!editingData.open} onChange={e=>setEditingData({...editingData, open: e.target.checked})} /> Open</label>
                  </div>
                  <div style={{marginTop:8}}>
                    <button onClick={()=>saveEdit(s.id)}>Save</button>
                    <button onClick={cancelEdit} style={{marginLeft:8}}>Cancel</button>
                  </div>
                </div>
              ) : (
                <div>
                  <div style={{display:'flex', justifyContent:'space-between'}}>
                    <strong>{s.name}</strong>
                    <div onDoubleClick={()=>toggleOpen(s.id, s.open)} style={{cursor:'pointer'}} title="Double-click to toggle open/closed">{s.open ? 'Open' : 'Closed'}</div>
                  </div>
                  <div>Coords: {s.lat}, {s.lng}</div>
                  <div>Available: {s.available} / {s.capacity}</div>
                  <div style={{marginTop:8}}>
                    <button onClick={()=>changeInventory(s.id, 1)}>+1 Bike</button>
                    <button onClick={()=>changeInventory(s.id, -1)} style={{marginLeft:8}}>-1 Bike</button>
                    <button onClick={()=>{ const c = prompt('New capacity:', s.capacity); if (c) setCapacity(s.id, Number(c)) }} style={{marginLeft:8}}>Set Capacity</button>
                    <button onClick={()=>startEdit(s)} style={{marginLeft:8}}>Edit</button>
                    <button onClick={()=>deleteStation(s.id)} style={{marginLeft:8, color:'red'}}>Delete</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

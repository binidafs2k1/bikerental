import React, { useEffect, useState } from 'react'
import API from '../api'

export default function Rentals(){
  const [rentals, setRentals] = useState([])
  const [stations, setStations] = useState([])
  const [returning, setReturning] = useState(null) // rental being returned
  const [selectedStation, setSelectedStation] = useState('')

  useEffect(()=>{ fetch(); loadStations() }, [])
  async function fetch(){
    const res = await API.get('/rentals/me');
    setRentals(res.data);
  }

  async function loadStations(){
    try{
      const res = await API.get('/stations');
      setStations(res.data);
    }catch(e){ setStations([]) }
  }

  function beginReturn(r){
    setReturning(r);
    // default select to first open station if available
    const openStations = stations.filter(s => s.open);
    setSelectedStation(openStations[0]?.id || '');
  }

  async function submitReturn(){
    if (!returning) return;
    if (!selectedStation) { alert('Please choose a station to return to'); return }
    try{
      await API.post('/rentals/return', { rentalId: returning.id, stationId: selectedStation });
      alert('Returned');
      setReturning(null);
      setSelectedStation('');
      fetch();
      loadStations();
    }catch(e){ alert(e.response?.data?.error || 'Error') }
  }

  function cancelReturn(){ setReturning(null); setSelectedStation('') }

  return (
    <div>
      <h3>Your Rentals</h3>
      {rentals.map(r => (
        <div key={r.id} className="card">
          <div>Status: {r.status}</div>
          <div>From: {r.fromStation?.name || r.fromStationId}</div>
          <div>To: {r.toStation?.name || r.toStationId || '—'}</div>
          <div>Started: {r.startedAt}</div>
          <div>Ended: {r.endedAt || '—'}</div>
          {r.status === 'active' && <button onClick={()=>beginReturn(r)}>Return</button>}
        </div>
      ))}

      {returning && (
        <div className="card">
          <h4>Return rental #{returning.id}</h4>
          <div>
            <label>Choose station to return to:</label>
            <select value={selectedStation} onChange={e=>setSelectedStation(e.target.value)}>
              <option value="">-- choose station --</option>
              {stations.filter(s => s.open).map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
          <div style={{marginTop:8}}>
            <button onClick={submitReturn}>Submit Return</button>
            <button onClick={cancelReturn} style={{marginLeft:8}}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  )
}

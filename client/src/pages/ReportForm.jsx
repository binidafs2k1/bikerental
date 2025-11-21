import React, { useEffect, useState } from 'react'
import API from '../api'

export default function ReportForm(){
  const [stations, setStations] = useState([])
  const [stationId, setStationId] = useState('')
  const [description, setDescription] = useState('')

  useEffect(()=>{ load() }, [])
  async function load(){
    const res = await API.get('/stations');
    setStations(res.data);
    if (res.data[0]) setStationId(res.data[0].id)
  }

  async function submit(e){
    e.preventDefault();
    await API.post('/reports', { stationId, description });
    alert('Report submitted');
    setDescription('');
  }

  return (
    <div className="card">
      <h3>Report Broken Bike</h3>
      <form onSubmit={submit}>
        <div>
          <select value={stationId} onChange={e=>setStationId(e.target.value)}>
            {stations.map(s=> <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div><textarea placeholder="Description" value={description} onChange={e=>setDescription(e.target.value)} /></div>
        <button type="submit">Send Report</button>
      </form>
    </div>
  )
}

import React, { useEffect, useState, useRef } from 'react';
import API from '../api';

export default function Stations() {
  const [stations, setStations] = useState([]);
  const [filter, setFilter] = useState('all');
  const [query, setQuery] = useState('');
  const polling = useRef(null);

  useEffect(() => {
    fetchStations();
    startPoll();
    return stopPoll;
  }, []);

  function startPoll() {
    polling.current = setInterval(fetchStations, 5000);
  }
  function stopPoll() {
    if (polling.current) clearInterval(polling.current);
  }

  async function fetchStations() {
    try {
      const res = await API.get('/stations');
      setStations(res.data);
    } catch (e) {}
  }

  async function rent(id) {
    try {
      const res = await API.post('/rentals/rent', { stationId: id });
      alert('Rented! rentalId: ' + res.data.rentalId);
      fetchStations();
    } catch (e) {
      alert(e.response?.data?.error || 'Error');
    }
  }

  function filtered() {
    return stations.filter((s) => {
      if (filter === 'open' && !s.open) return false;
      if (filter === 'closed' && s.open) return false;
      if (query && !s.name.toLowerCase().includes(query.toLowerCase())) return false;
      return true;
    });
  }

  return (
    <div>
      <h3>Stations</h3>
      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        <input placeholder="Search by name" value={query} onChange={(e) => setQuery(e.target.value)} />
        <select value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="all">All</option>
          <option value="open">Open</option>
          <option value="closed">Closed</option>
        </select>
      </div>
      {filtered().map((s) => (
        <div key={s.id} className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <strong>{s.name}</strong>
            <div>{s.open ? 'Open' : 'Closed'}</div>
          </div>
          <div>Available: {s.available} / {s.capacity}</div>
          <div style={{ marginTop: 8 }}>
            <button onClick={() => rent(s.id)} disabled={!s.open || s.available <= 0}>Rent</button>
          </div>
        </div>
      ))}
    </div>
  );
}

import React, { useEffect, useState } from "react";
import API from "../api";

export default function Rentals() {
  const [rentals, setRentals] = useState([]);
  const [stations, setStations] = useState([]);
  const [returning, setReturning] = useState(null); // rental being returned
  const [selectedStation, setSelectedStation] = useState("");

  useEffect(() => {
    fetch();
    loadStations();
  }, []);
  async function fetch() {
    const res = await API.get("/rentals/me");
    setRentals(res.data.sort((a, b) => new Date(b.startedAt) - new Date(a.startedAt)));
  }

  async function loadStations() {
    try {
      const res = await API.get("/stations");
      setStations(res.data);
    } catch (e) {
      setStations([]);
    }
  }

  function beginReturn(r) {
    setReturning(r);
    // default select to first open station if available
    const openStations = stations.filter((s) => s.open);
    setSelectedStation(openStations[0]?.id || "");
  }

  async function submitReturn() {
    if (!returning) return;
    if (!selectedStation) {
      alert("Please choose a station to return to");
      return;
    }
    const confirmed = window.confirm(`Are you sure you want to return the bike to ${stations.find(s => s.id === selectedStation)?.name}?`);
    if (!confirmed) return;
    try {
      await API.post("/rentals/return", {
        rentalId: returning.id,
        stationId: selectedStation,
      });
      alert("Bike returned successfully!");
      setReturning(null);
      setSelectedStation("");
      fetch();
      loadStations();
    } catch (e) {
      alert(e.response?.data?.error || "Error returning bike");
    }
  }

  function cancelReturn() {
    setReturning(null);
    setSelectedStation("");
  }

  return (
    <div className="rentals-container">
      <h3>Your Rentals</h3>
      <div className="rentals-list">
        {rentals.map((r) => (
          <div key={r.id} className="rental-item">
            <div className="rental-header">
              <span className={`status-badge status-${r.status}`}>
                {r.status.charAt(0).toUpperCase() + r.status.slice(1)}
              </span>
              <span className="rental-id">Rental #{r.id}</span>
            </div>
            <div className="rental-details">
              <div className="rental-detail">
                <strong>From:</strong> {r.fromStation?.name || r.fromStationId}
              </div>
              <div className="rental-detail">
                <strong>To:</strong> {r.toStation?.name || r.toStationId || "Not returned"}
              </div>
              <div className="rental-detail">
                <strong>Started:</strong> {new Date(r.startedAt).toLocaleString()}
              </div>
              <div className="rental-detail">
                <strong>Ended:</strong> {r.endedAt ? new Date(r.endedAt).toLocaleString() : "Ongoing"}
              </div>
            </div>
            {r.status === "active" && (
              <div className="rental-actions">
                <button onClick={() => beginReturn(r)} className="btn">Return Bike</button>
              </div>
            )}
          </div>
        ))}
        {rentals.length === 0 && (
          <div className="empty-state">No rentals found.</div>
        )}
      </div>

      {returning && (
        <div className="return-modal-overlay">
          <div className="return-modal">
            <h4>Return Bike</h4>
            <p>Rental #{returning.id} - Started: {new Date(returning.startedAt).toLocaleString()}</p>
            <div className="form-group">
              <label className="form-label">Choose return station:</label>
              <select
                value={selectedStation}
                onChange={(e) => setSelectedStation(e.target.value)}
                className="form-select"
              >
                <option value="">-- Select station --</option>
                {stations
                  .filter((s) => s.open)
                  .map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
              </select>
            </div>
            <div className="modal-actions">
              <button onClick={submitReturn} className="btn" disabled={!selectedStation}>
                Confirm Return
              </button>
              <button onClick={cancelReturn} className="btn secondary">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

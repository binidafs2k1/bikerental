import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api";
import { formatDateTime } from "./formatDate";

export default function Rentals() {
  const navigate = useNavigate();
  const [rentals, setRentals] = useState([]);
  const [stations, setStations] = useState([]);
  const [returning, setReturning] = useState(null); // rental being returned
  const [selectedStation, setSelectedStation] = useState("");

  useEffect(() => {
    fetch();
    loadStations();
  }, []);
  async function fetch() {
    try {
      const res = await API.get("/rentals/me");
      setRentals(
        res.data.sort((a, b) => new Date(b.startedAt) - new Date(a.startedAt))
      );
    } catch (err) {
      // if unauthorized, clear rentals and show a helpful message
      if (err.response?.status === 401) {
        // Unauthorized — clear auth and redirect to login so refresh works correctly
        localStorage.removeItem("token");
        localStorage.removeItem("isAdmin");
        localStorage.removeItem("username");
        navigate("/login");
        return;
      }
      console.error("Failed to load rentals", err);
      setRentals([]);
    }
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
    setSelectedStation(openStations[0]?.id ? Number(openStations[0].id) : "");
  }

  async function submitReturn() {
    if (!returning) return;
    if (!selectedStation && selectedStation !== 0) {
      alert("Please choose a station to return to");
      return;
    }
    const targetStation = stations.find(
      (s) => s.id === Number(selectedStation)
    );
    const confirmed = window.confirm(
      `Are you sure you want to return the bike to ${
        targetStation?.name || "the selected station"
      }?`
    );
    if (!confirmed) return;
    try {
      await API.post("/rentals/return", {
        rentalId: returning.id,
        stationId: Number(selectedStation),
      });
      alert("Bike returned successfully!");
      setReturning(null);
      setSelectedStation("");
      fetch();
      loadStations();
    } catch (e) {
      if (e.response?.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("isAdmin");
        localStorage.removeItem("username");
        navigate("/login");
      } else if (e.response?.status === 403) {
        alert("You are not allowed to return this rental.");
      } else {
        alert(e.response?.data?.error || "Error returning bike");
      }
      console.error("Return error:", e);
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
                <strong>
                  {r.status === "returned" ? "Returned to:" : "To:"}
                </strong>{" "}
                {r.toStation?.name ||
                  r.toStationId ||
                  (r.status === "returned"
                    ? "(unknown station)"
                    : "Not returned")}
              </div>
              <div className="rental-detail">
                <strong>Started:</strong>{" "}
                {formatDateTime(r.startedAt) || "Unknown"}
              </div>
              <div className="rental-detail">
                <strong>Ended:</strong>{" "}
                {r.endedAt ? formatDateTime(r.endedAt) : "Ongoing"}
              </div>
            </div>
            {r.status === "active" && (
              <div className="rental-actions">
                <button onClick={() => beginReturn(r)} className="btn">
                  Return Bike
                </button>
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
            <p>
              Rental #{returning.id} - Started:{" "}
              {formatDateTime(returning.startedAt)}
            </p>
            <div className="form-group">
              <label className="form-label">Choose return station:</label>
              <select
                value={selectedStation}
                onChange={(e) =>
                  setSelectedStation(
                    e.target.value === "" ? "" : Number(e.target.value)
                  )
                }
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
              <button
                onClick={submitReturn}
                className="btn"
                disabled={!selectedStation}
              >
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

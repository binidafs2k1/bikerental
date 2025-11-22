import React, { useEffect, useMemo, useRef, useState } from "react";
import { MapPin, Search } from "lucide-react";
import API from "../api";
import MapView from "./MapView";

export default function Stations() {
  const [stations, setStations] = useState([]);
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");
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
      const response = await API.get("/stations");
      setStations(response.data);
    } catch (error) {
      console.error("Unable to load stations", error);
    }
  }

  async function rent(id) {
    try {
      const res = await API.post("/rentals/rent", { stationId: id });
      alert("Rented! rentalId: " + res.data.rentalId);
      fetchStations();
    } catch (e) {
      alert(e.response?.data?.error || "Error renting bike");
    }
  }

  const filteredStations = useMemo(() => {
    return stations.filter((station) => {
      if (filter === "open" && !station.open) return false;
      if (filter === "closed" && station.open) return false;
      if (query && !station.name.toLowerCase().includes(query.toLowerCase())) {
        return false;
      }
      return true;
    });
  }, [stations, filter, query]);

  const formatCoord = (value) => {
    if (value === undefined || value === null) return "-";
    const cleaned = Number(value);
    return Number.isFinite(cleaned) ? cleaned.toFixed(2) : "-";
  };

  return (
    <div className="user-home">
      <section className="hero-card">
        <div>
          <p className="hero-label">BikeShare Stations</p>
          <h1 className="hero-title">Find a station, reserve quickly</h1>
          <p className="hero-subtitle">
            Browse open hubs, check availability, and get live map updates in one place.
          </p>
        </div>

        <div className="hero-search">
          <div className="input-with-icon">
            <Search size={18} />
            <input
              type="search"
              placeholder="Search by station name"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <select
            className="filter-select"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="all">All stations</option>
            <option value="open">Open only</option>
            <option value="closed">Closed</option>
          </select>
        </div>
      </section>

      <section className="station-grid">
        <div className="station-list">
          <div className="station-list__header">
            <div>
              <p className="station-list__title">Featured stations</p>
              <p className="station-list__subtitle">
                Tap to view details, rent bikes, or plan your route.
              </p>
            </div>
            <span className="station-count">{filteredStations.length} results</span>
          </div>
          <div className="station-list__content">
            {filteredStations.map((station) => (
              <div key={station.id} className="station-card">
                <div className="station-card__header">
                  <div className="station-card__title-group">
                    <div className="station-card__title">
                      <MapPin size={16} />
                      <strong>{station.name}</strong>
                    </div>
                    <span
                      className={`status-label ${station.open ? "status-open" : "status-closed"}`}
                    >
                      {station.open ? "Open" : "Closed"}
                    </span>
                  </div>
                  <button
                    className="action-pill action-pill--green station-card__button"
                    onClick={() => rent(station.id)}
                    disabled={!station.open || station.available <= 0}
                  >
                    Rent Bike
                  </button>
                </div>
                <div className="station-card__body">
                  <p className="station-card__text">
                    Available: <strong>{station.available}</strong> / {station.capacity}
                  </p>
                  <p className="station-card__text">
                    Lat {formatCoord(station.lat)} · Lng {formatCoord(station.lng)}
                  </p>
                </div>
              </div>
            ))}
            {filteredStations.length === 0 && (
              <div className="empty-state">No stations match your filter.</div>
            )}
          </div>
        </div>
        <div className="station-map">
          <MapView stations={filteredStations.length ? filteredStations : stations} />
        </div>
      </section>
    </div>
  );
}

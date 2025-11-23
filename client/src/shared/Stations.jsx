import React, { useEffect, useMemo, useRef, useState } from "react";
import { MapPin, Search, Heart } from "lucide-react";
import { useNavigate } from "react-router-dom";
import API from "../api";
import MapView from "./MapView";

export default function Stations() {
  const [stations, setStations] = useState([]);
  const [favorites, setFavorites] = useState({}); // { [stationId]: { id, createdAt } }
  const navigate = useNavigate();
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");
  const polling = useRef(null);

  useEffect(() => {
    fetchStations();
    fetchFavorites();
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

  async function fetchFavorites() {
    try {
      // only fetch favorites if we have a token
      if (!localStorage.getItem("token")) return setFavorites({});
      const res = await API.get("/favorites/me");
      const map = {};
      for (const f of res.data) {
        if (f.Station && f.Station.id)
          map[f.Station.id] = { id: f.id, createdAt: f.createdAt };
      }
      setFavorites(map);
    } catch (e) {
      // ignore unauthorized (not logged in), or other errors
      if (e.response?.status === 401) return setFavorites({});
      console.error("Unable to load favorites", e);
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

  async function toggleFavorite(stationId) {
    try {
      if (!localStorage.getItem("token")) {
        // not logged in — navigate to login
        navigate("/login");
        return;
      }
      const res = await API.post("/favorites", { stationId });
      if (res.data.favorited) {
        // created
        setFavorites((s) => ({
          ...s,
          [stationId]: { id: res.data.id, createdAt: res.data.createdAt },
        }));
      } else {
        setFavorites((s) => {
          const copy = { ...s };
          delete copy[stationId];
          return copy;
        });
      }
    } catch (e) {
      console.error("Unable to toggle favorite", e);
      if (e.response?.status === 401) navigate("/login");
      else alert(e.response?.data?.error || "Error toggling favorite");
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
            Browse open hubs, check availability, and get live map updates in
            one place.
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
            <span className="station-count">
              {filteredStations.length} results
            </span>
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
                    <div
                      style={{ display: "flex", gap: 8, alignItems: "center" }}
                    >
                      <span
                        className={`status-label ${
                          station.open ? "status-open" : "status-closed"
                        }`}
                      >
                        {station.open ? "Open" : "Closed"}
                      </span>
                      <button
                        className={`favorite-button ${
                          favorites[station.id] ? "favorited" : ""
                        }`}
                        onClick={() => toggleFavorite(station.id)}
                        title={
                          favorites[station.id]
                            ? "Unfavorite"
                            : "Add to favorites"
                        }
                        aria-pressed={!!favorites[station.id]}
                      >
                        <Heart size={16} />
                      </button>
                    </div>
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
                    Available: <strong>{station.available}</strong> /{" "}
                    {station.capacity}
                  </p>
                  <p className="station-card__text">
                    Lat {formatCoord(station.lat)} · Lng{" "}
                    {formatCoord(station.lng)}
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
          <MapView
            stations={filteredStations.length ? filteredStations : stations}
            favorites={favorites}
            toggleFavorite={toggleFavorite}
          />
        </div>
      </section>
    </div>
  );
}

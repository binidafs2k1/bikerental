import React, { useEffect, useState, useRef } from "react";
import { Heart } from "lucide-react";
import { useNavigate } from "react-router-dom";
import API from "../api";

export default function Stations() {
  const [stations, setStations] = useState([]);
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [favorites, setFavorites] = useState({});
  const navigate = useNavigate();
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
      const res = await API.get("/stations");
      setStations(res.data);
    } catch (e) {}
  }

  async function fetchFavorites() {
    try {
      if (!localStorage.getItem("token")) return setFavorites({});
      const res = await API.get("/favorites/me");
      const map = {};
      for (const f of res.data) {
        if (f.Station && f.Station.id)
          map[f.Station.id] = { id: f.id, createdAt: f.createdAt };
      }
      setFavorites(map);
    } catch (e) {
      console.error(e);
      setFavorites({});
    }
  }

  async function rent(id) {
    try {
      const res = await API.post("/rentals/rent", { stationId: id });
      alert("Rented! rentalId: " + res.data.rentalId);
      fetchStations();
    } catch (e) {
      alert(e.response?.data?.error || "Error");
    }
  }

  async function toggleFavorite(stationId) {
    try {
      if (!localStorage.getItem("token")) {
        navigate("/login");
        return;
      }
      const res = await API.post("/favorites", { stationId });
      if (res.data.favorited) {
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
      console.error(e);
      if (e.response?.status === 401) navigate("/login");
      else alert(e.response?.data?.error || "Error");
    }
  }

  function filtered() {
    return stations.filter((s) => {
      if (filter === "open" && !s.open) return false;
      if (filter === "closed" && s.open) return false;
      if (query && !s.name.toLowerCase().includes(query.toLowerCase()))
        return false;
      return true;
    });
  }

  return (
    <div>
      <h3>Stations</h3>
      <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
        <input
          placeholder="Search by name"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <select value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="all">All</option>
          <option value="open">Open</option>
          <option value="closed">Closed</option>
        </select>
      </div>
      {filtered().map((s) => (
        <div key={s.id} className="card" style={{ position: "relative" }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <strong>{s.name}</strong>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <div>{s.open ? "Open" : "Closed"}</div>
              <button
                className={`favorite-button ${
                  favorites[s.id] ? "favorited" : ""
                }`}
                onClick={() => toggleFavorite(s.id)}
                aria-pressed={!!favorites[s.id]}
              >
                <Heart size={16} />
              </button>
            </div>
          </div>
          <div>
            Available: {s.available} / {s.capacity}
          </div>
          <div style={{ marginTop: 8 }}>
            <button
              onClick={() => rent(s.id)}
              disabled={!s.open || s.available <= 0}
            >
              Rent
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

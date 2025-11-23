import React, { useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import API from "../api";

export default function MapView({
  stations: stationProp = [],
  favorites = {},
  toggleFavorite,
}) {
  const [stations, setStations] = useState(stationProp);

  useEffect(() => {
    if (!stationProp.length) {
      load();
    }
  }, [stationProp.length]);
  async function load() {
    const res = await API.get("/stations");
    setStations(res.data);
  }

  useEffect(() => {
    if (stationProp.length) {
      setStations(stationProp);
    }
  }, [stationProp]);

  const defaultSeoulView = [37.548, 126.98];
  const viewZoom = 12;

  const center = stations[0]
    ? [stations[0].lat, stations[0].lng]
    : defaultSeoulView;

  const defaultIcon = useMemo(
    () =>
      L.icon({
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        iconRetinaUrl:
          "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        shadowUrl:
          "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41],
      }),
    []
  );

  // Use a small CSS-based DivIcon for favorites so we don't depend on external images
  // DivIcon uses HTML/CSS and avoids 404/broken image problems.
  const favoriteIcon = useMemo(
    () =>
      L.divIcon({
        className: "leaflet-favorite-icon",
        html: '<div class="favorite-pin" aria-hidden="true"></div>',
        iconSize: [24, 24],
        iconAnchor: [12, 24],
        popupAnchor: [0, -24],
      }),
    []
  );

  return (
    <div className="map-wrapper">
      <MapContainer
        center={center}
        zoom={viewZoom}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        {stations.map((s) => (
          <Marker
            key={s.id}
            position={[s.lat, s.lng]}
            icon={
              favorites && (favorites[s.id] || favorites[s?.id])
                ? favoriteIcon
                : defaultIcon
            }
            eventHandlers={
              toggleFavorite
                ? {
                    click: (e) => {
                      try {
                        // Prevent the popup from staying open when using click-to-toggle
                        e.originalEvent?.stopPropagation?.();
                        e.originalEvent?.preventDefault?.();
                      } catch (err) {
                        // ignore
                      }
                      // call the passed-in handler
                      toggleFavorite(s.id);

                      // close the popup immediately if it opened
                      try {
                        e.target?.closePopup?.();
                      } catch (err) {}
                    },
                  }
                : undefined
            }
          >
            <Popup>
              <div>
                <strong>{s.name}</strong>
              </div>
              <div>
                Available: {s.available} / {s.capacity}
              </div>
              <div>Status: {s.open ? "Open" : "Closed"}</div>
              {toggleFavorite ? (
                <div style={{ marginTop: 8 }}>
                  <button
                    className="btn-link"
                    onClick={() => toggleFavorite(s.id)}
                    aria-pressed={
                      !!(favorites && (favorites[s.id] || favorites[s?.id]))
                    }
                  >
                    {favorites && (favorites[s.id] || favorites[s?.id])
                      ? "Unfavorite"
                      : "Favorite"}
                  </button>
                </div>
              ) : null}
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}

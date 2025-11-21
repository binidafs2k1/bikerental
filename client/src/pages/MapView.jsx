import React, { useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import API from '../api'

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

export default function MapView(){
  const [stations, setStations] = React.useState([])

  useEffect(()=>{ load() }, [])
  async function load(){
    const res = await API.get('/stations');
    setStations(res.data);
  }

  const center = stations[0] ? [stations[0].lat, stations[0].lng] : [37.5665, 126.9780]

  return (
    <div className="card" style={{height: '60vh'}}>
      <MapContainer center={center} zoom={14} style={{ height: '100%', width: '100%' }}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        {stations.filter(s => s.open).map(s => (
          <Marker key={s.id} position={[s.lat, s.lng]}>
            <Popup>
              <div><strong>{s.name}</strong></div>
              <div>Available: {s.available} / {s.capacity}</div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  )
}

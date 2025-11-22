import React, { useEffect, useState } from "react";
import API from "../api";

export default function ReportForm() {
  const [stations, setStations] = useState([]);
  const [stationId, setStationId] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    load();
  }, []);
  async function load() {
    const res = await API.get("/stations");
    setStations(res.data);
    if (res.data[0]) setStationId(res.data[0].id);
  }

  async function submit(e) {
    e.preventDefault();
    await API.post("/reports", { stationId, description });
    alert("Report submitted");
    setDescription("");
  }

  return (
    <div className="report-container">
      <h1>Report Broken Bike</h1>
      <form onSubmit={submit} className="create-report-form">
        <div className="form-group">
          <label className="form-label">Station</label>
          <select
            value={stationId}
            onChange={(e) => setStationId(e.target.value)}
            className="form-select"
            required
          >
            {stations.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Description</label>
          <textarea
            placeholder="Describe the issue with the bike"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="form-textarea"
            required
          />
        </div>
        <div className="form-actions">
          <button type="submit" className="btn">
            Send Report
          </button>
        </div>
      </form>
    </div>
  );
}

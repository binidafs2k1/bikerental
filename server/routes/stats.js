const express = require("express");
const router = express.Router();
const { query } = require("../db");

// Return aggregated station data for visualization
router.get("/stations", async (req, res) => {
  const stations = await query("SELECT * FROM Stations");
  // simple aggregation: availability per station
  const data = stations.map((s) => ({
    id: s.id,
    name: s.name,
    available: s.available,
    capacity: s.capacity,
  }));
  res.json({ stations: data });
});

module.exports = router;

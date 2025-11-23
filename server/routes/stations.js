const express = require("express");
const router = express.Router();
const { query } = require("../db");

router.get("/", async (req, res) => {
  const stations = await query("SELECT * FROM Stations");
  res.json(stations);
});

router.get("/:id", async (req, res) => {
  const srows = await query("SELECT * FROM Stations WHERE id = ?", [
    req.params.id,
  ]);
  const s = srows[0];
  if (!s) return res.status(404).json({ error: "Not found" });
  res.json(s);
});

// toggle open/close - expects admin or authorized client in production
router.put("/:id/toggle", async (req, res) => {
  const id = req.params.id;
  const srows = await query("SELECT * FROM Stations WHERE id = ?", [id]);
  if (!srows || srows.length === 0)
    return res.status(404).json({ error: "Not found" });
  const newOpen = srows[0].open ? 0 : 1;
  await query("UPDATE Stations SET open = ? WHERE id = ?", [newOpen, id]);
  const updated = await query("SELECT * FROM Stations WHERE id = ?", [id]);
  res.json(updated[0]);
});

module.exports = router;

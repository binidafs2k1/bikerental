const express = require("express");
const router = express.Router();
const { query } = require("../db");
const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "secret-change-me";

function auth(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: "No token" });
  const token = auth.split(" ")[1];
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (e) {
    return res.status(401).json({ error: "Invalid token" });
  }
}

// Edit report (user can update description)
router.put("/:id", auth, async (req, res) => {
  const { id } = req.params;
  const { description } = req.body;
  const rRows = await query("SELECT * FROM Reports WHERE id = ?", [id]);
  const report = rRows[0];
  if (!report) return res.status(404).json({ error: "Not found" });
  if (report.UserId !== req.user.id)
    return res.status(403).json({ error: "Forbidden" });
  if (description)
    await query("UPDATE Reports SET description = ? WHERE id = ?", [
      description,
      id,
    ]);
  const updatedRows = await query(
    `SELECT r.*, s.id as station_id, s.name as station_name, u.id as user_id, u.username as user_username
    FROM Reports r LEFT JOIN Stations s ON r.StationId = s.id LEFT JOIN Users u ON r.UserId = u.id WHERE r.id = ?`,
    [id]
  );
  const rr = updatedRows[0];
  res.json({
    ...rr,
    Station: rr.station_id
      ? { id: rr.station_id, name: rr.station_name }
      : null,
    User: rr.user_id ? { id: rr.user_id, username: rr.user_username } : null,
  });
});

// Delete report (user can delete their own)
router.delete("/:id", auth, async (req, res) => {
  const { id } = req.params;
  const rRows = await query("SELECT * FROM Reports WHERE id = ?", [id]);
  const report = rRows[0];
  if (!report) return res.status(404).json({ error: "Not found" });
  if (report.UserId !== req.user.id)
    return res.status(403).json({ error: "Forbidden" });
  await query("DELETE FROM Reports WHERE id = ?", [id]);
  res.json({ success: true });
});

router.get("/", async (req, res) => {
  const rows = await query(
    `SELECT r.*, s.id as station_id, s.name as station_name, u.id as user_id, u.username as user_username
     FROM Reports r
     LEFT JOIN Stations s ON r.StationId = s.id
     LEFT JOIN Users u ON r.UserId = u.id`
  );
  const reports = rows.map((r) => ({
    ...r,
    Station: r.station_id ? { id: r.station_id, name: r.station_name } : null,
    User: r.user_id ? { id: r.user_id, username: r.user_username } : null,
  }));
  res.json(reports);
});

router.get("/me", auth, async (req, res) => {
  const rows = await query(
    `SELECT r.*, s.id as station_id, s.name as station_name
     FROM Reports r
     LEFT JOIN Stations s ON r.StationId = s.id
     WHERE r.UserId = ?`,
    [req.user.id]
  );
  const reports = rows.map((r) => ({
    ...r,
    Station: r.station_id ? { id: r.station_id, name: r.station_name } : null,
  }));
  res.json(reports);
});

router.post("/", auth, async (req, res) => {
  const { stationId, description } = req.body;
  const result = await query(
    "INSERT INTO Reports (StationId, UserId, description) VALUES (?, ?, ?)",
    [stationId, req.user.id, description]
  );
  const rows = await query(
    `SELECT r.*, s.id as station_id, s.name as station_name, u.id as user_id, u.username as user_username
    FROM Reports r LEFT JOIN Stations s ON r.StationId = s.id LEFT JOIN Users u ON r.UserId = u.id WHERE r.id = ?`,
    [result.insertId]
  );
  const r = rows[0];
  res.json({
    ...r,
    Station: r.station_id ? { id: r.station_id, name: r.station_name } : null,
    User: r.user_id ? { id: r.user_id, username: r.user_username } : null,
  });
});

module.exports = router;

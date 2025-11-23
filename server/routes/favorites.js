const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const { query } = require("../db");

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

// List current user's favorites
router.get("/me", auth, async (req, res) => {
  const rows = await query(
    `SELECT f.id as favoriteId, f.createdAt as favoritedAt, s.*
       FROM Favorites f
       LEFT JOIN Stations s ON f.StationId = s.id
       WHERE f.UserId = ?
       ORDER BY f.createdAt DESC`,
    [req.user.id]
  );
  res.json(
    rows.map((r) => ({
      id: r.favoriteId,
      createdAt: r.favoritedAt ? new Date(r.favoritedAt).toISOString() : null,
      Station: r.id
        ? {
            id: r.id,
            name: r.name,
            lat: r.lat,
            lng: r.lng,
            capacity: r.capacity,
            open: r.open,
            available: r.available,
          }
        : null,
    }))
  );
});

// Toggle favorite for the current user and station
// Body: { stationId }
// If favorite exists -> remove it and return { favorited: false }
// If not exists -> create and return { favorited: true, id }
router.post("/", auth, async (req, res) => {
  const { stationId } = req.body;
  if (!stationId) return res.status(400).json({ error: "Missing stationId" });

  const existing = await query(
    "SELECT id FROM Favorites WHERE UserId = ? AND StationId = ?",
    [req.user.id, stationId]
  );
  if (existing && existing.length) {
    await query("DELETE FROM Favorites WHERE id = ?", [existing[0].id]);
    return res.json({ favorited: false });
  }

  const result = await query(
    "INSERT INTO Favorites (UserId, StationId) VALUES (?, ?)",
    [req.user.id, stationId]
  );
  // when using query helper this returns insert result with insertId often; our query returns rows — use pool directly if needed
  // to keep consistent, read back the inserted row
  const inserted = await query(
    "SELECT id, createdAt FROM Favorites WHERE UserId = ? AND StationId = ? ORDER BY id DESC LIMIT 1",
    [req.user.id, stationId]
  );
  res.json({
    favorited: true,
    id: inserted[0]?.id,
    createdAt: inserted[0]?.createdAt
      ? new Date(inserted[0].createdAt).toISOString()
      : null,
  });
});

// Remove favorite by favorite id (only owner can delete)
router.delete("/:id", auth, async (req, res) => {
  const { id } = req.params;
  const fav = await query("SELECT * FROM Favorites WHERE id = ?", [id]);
  if (!fav || fav.length === 0)
    return res.status(404).json({ error: "Not found" });
  if (fav[0].UserId !== req.user.id)
    return res.status(403).json({ error: "Forbidden" });
  await query("DELETE FROM Favorites WHERE id = ?", [id]);
  res.json({ success: true });
});

module.exports = router;

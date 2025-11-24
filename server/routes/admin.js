const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const { query } = require("../db");

const JWT_SECRET = process.env.JWT_SECRET || "secret-change-me";

function adminOnly(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: "No token" });
  const token = auth.split(" ")[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    if (payload.role !== "admin")
      return res.status(403).json({ error: "Admins only" });
    req.user = payload;
    next();
  } catch (e) {
    return res.status(401).json({ error: "Invalid token" });
  }
}

// Admin: delete any post
router.delete("/posts/:id", adminOnly, async (req, res) => {
  const { id } = req.params;
  const post = await query("SELECT id FROM Posts WHERE id = ?", [id]);
  if (!post || post.length === 0)
    return res.status(404).json({ error: "Not found" });
  await query("DELETE FROM Posts WHERE id = ?", [id]);
  res.json({ success: true });
});
// Admin: view all reports
router.get("/reports", adminOnly, async (req, res) => {
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

// Admin: update report status
router.put("/reports/:id", adminOnly, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const r = await query("SELECT * FROM Reports WHERE id = ?", [id]);
  if (!r || r.length === 0) return res.status(404).json({ error: "Not found" });
  if (status) {
    await query("UPDATE Reports SET status = ? WHERE id = ?", [status, id]);
  }
  const updated = await query("SELECT * FROM Reports WHERE id = ?", [id]);
  res.json(updated[0]);
});

// Admin: delete report
router.delete("/reports/:id", adminOnly, async (req, res) => {
  const { id } = req.params;
  const r = await query("SELECT id FROM Reports WHERE id = ?", [id]);
  if (!r || r.length === 0) return res.status(404).json({ error: "Not found" });
  await query("DELETE FROM Reports WHERE id = ?", [id]);
  res.json({ success: true });
});

// Manage users
router.get("/users", adminOnly, async (req, res) => {
  const users = await query("SELECT id, username, role FROM Users");
  res.json(users);
});

router.put("/users/:id/role", adminOnly, async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;
  const u = await query("SELECT * FROM Users WHERE id = ?", [id]);
  if (!u || u.length === 0) return res.status(404).json({ error: "Not found" });
  await query("UPDATE Users SET role = ? WHERE id = ?", [role, id]);
  const updated = await query(
    "SELECT id, username, role FROM Users WHERE id = ?",
    [id]
  );
  res.json(updated[0]);
});

router.delete("/users/:id", adminOnly, async (req, res) => {
  const { id } = req.params;
  const u = await query("SELECT * FROM Users WHERE id = ?", [id]);
  if (!u || u.length === 0) return res.status(404).json({ error: "Not found" });

  // Prevent deleting self
  if (Number(id) === req.user.id) {
    return res.status(400).json({ error: "Cannot delete yourself" });
  }

  await query("DELETE FROM Users WHERE id = ?", [id]);
  res.json({ success: true });
});

// Manage stations
router.get("/stations", adminOnly, async (req, res) => {
  const stations = await query("SELECT * FROM Stations");
  res.json(stations);
});

router.post("/stations", adminOnly, async (req, res) => {
  try {
    const { name, lat, lng, capacity, available, open } = req.body;
    if (!name) return res.status(400).json({ error: "Name is required" });
    const latNum = parseFloat(lat);
    const lngNum = parseFloat(lng);
    if (Number.isNaN(latNum) || Number.isNaN(lngNum))
      return res.status(400).json({ error: "lat and lng must be numbers" });
    const capNum = capacity !== undefined ? Number(capacity) : 10;
    const availNum = available !== undefined ? Number(available) : 0;
    const result = await query(
      "INSERT INTO Stations (name, lat, lng, capacity, available, open) VALUES (?, ?, ?, ?, ?, ?)",
      [
        name,
        latNum,
        lngNum,
        capNum,
        availNum,
        open === undefined ? 1 : open ? 1 : 0,
      ]
    );
    const inserted = await query("SELECT * FROM Stations WHERE id = ?", [
      result.insertId,
    ]);
    res.json(inserted[0]);
  } catch (err) {
    console.error("Error creating station", err);
    res.status(400).json({ error: err.message });
  }
});

router.put("/stations/:id", adminOnly, async (req, res) => {
  const id = req.params.id;
  const s = await query("SELECT * FROM Stations WHERE id = ?", [id]);
  if (!s || s.length === 0) return res.status(404).json({ error: "Not found" });
  // Build update
  const fields = [];
  const params = [];
  for (const k of ["name", "lat", "lng", "capacity", "available", "open"]) {
    if (req.body[k] !== undefined) {
      fields.push(`${k} = ?`);
      params.push(req.body[k]);
    }
  }
  if (fields.length) {
    await query(`UPDATE Stations SET ${fields.join(", ")} WHERE id = ?`, [
      ...params,
      id,
    ]);
  }
  const updated = await query("SELECT * FROM Stations WHERE id = ?", [id]);
  res.json(updated[0]);
});

// Delete station
router.delete("/stations/:id", adminOnly, async (req, res) => {
  const id = req.params.id;
  const s = await query("SELECT * FROM Stations WHERE id = ?", [id]);
  if (!s || s.length === 0) return res.status(404).json({ error: "Not found" });
  await query("DELETE FROM Stations WHERE id = ?", [id]);
  res.json({ success: true });
});

// Adjust station inventory (add/remove bikes)
router.post("/stations/:id/inventory", adminOnly, async (req, res) => {
  const { id } = req.params;
  const { delta } = req.body; // integer: positive to add, negative to remove
  const sRows = await query("SELECT * FROM Stations WHERE id = ?", [id]);
  if (!sRows || sRows.length === 0)
    return res.status(404).json({ error: "Not found" });
  const s = sRows[0];
  const newAvailable = s.available + Number(delta || 0);
  // clamp
  const clamped = Math.max(0, Math.min(newAvailable, s.capacity));
  await query("UPDATE Stations SET available = ? WHERE id = ?", [clamped, id]);
  const updated = await query("SELECT * FROM Stations WHERE id = ?", [id]);
  res.json(updated[0]);
});

// Set capacity explicitly
router.post("/stations/:id/capacity", adminOnly, async (req, res) => {
  const { id } = req.params;
  const { capacity } = req.body;
  const sRows = await query("SELECT * FROM Stations WHERE id = ?", [id]);
  if (!sRows || sRows.length === 0)
    return res.status(404).json({ error: "Not found" });
  const s = sRows[0];
  const cap = Number(capacity || s.capacity);
  const avail = s.available > cap ? cap : s.available;
  await query("UPDATE Stations SET capacity = ?, available = ? WHERE id = ?", [
    cap,
    avail,
    id,
  ]);
  const updated = await query("SELECT * FROM Stations WHERE id = ?", [id]);
  res.json(updated[0]);
});

// Manage posts
router.get("/posts", adminOnly, async (req, res) => {
  // Check whether createdAt column exists in Posts table; fallback to id when not present
  const hasCreated = await query("SHOW COLUMNS FROM Posts LIKE 'createdAt'");
  const orderClause =
    hasCreated && hasCreated.length
      ? "ORDER BY p.createdAt DESC"
      : "ORDER BY p.id DESC";
  const rows = await query(
    `SELECT p.*, u.id as user_id, u.username as user_username
     FROM Posts p
     LEFT JOIN Users u ON p.UserId = u.id
     ${orderClause}`
  );
  const posts = rows.map((p) => ({
    ...p,
    createdAt: p.createdAt ? new Date(p.createdAt).toISOString() : null,
    updatedAt: p.updatedAt ? new Date(p.updatedAt).toISOString() : null,
    User: p.user_id ? { id: p.user_id, username: p.user_username } : null,
  }));
  res.json(posts);
});

// Admin: trigger import from Seoul sample (or custom URL) and upsert to Stations
router.post("/import/ddarungi", adminOnly, async (req, res) => {
  try {
    const { importSeoulSample } = require("../scripts/importSeoulSample");
    // optional url override in body
    const url = req.body?.url;
    const result = await importSeoulSample(url);
    res.json({ ok: true, result });
  } catch (err) {
    console.error("Import failed:", err);
    res.status(500).json({ ok: false, error: err.message || String(err) });
  }
});

// Admin visualization endpoint used by admin UI / D3 visualizations
// Returns aggregated data: users by age buckets, station bike counts, and report status counts with percentages
router.get("/visualization", adminOnly, async (req, res) => {
  try {
    // Users -> age buckets (0-9, 10-19, ...). Null ages labeled 'unknown'.
    const usersRows = await query(
      `SELECT
         CASE WHEN age IS NULL THEN -1 ELSE FLOOR(age/10) END AS bucket_index,
         CASE WHEN age IS NULL THEN 'unknown' ELSE CONCAT(FLOOR(age/10)*10, '-', FLOOR(age/10)*10 + 9) END AS bucket_label,
         COUNT(*) AS count
       FROM Users
       GROUP BY bucket_index, bucket_label
       ORDER BY bucket_index ASC`
    );

    const usersAgeBuckets = usersRows.map((r) => ({
      bucket: r.bucket_label,
      count: Number(r.count || 0),
    }));

    // Stations -> how many bikes available / capacity per station
    const stationRows = await query(
      `SELECT id, name, available, capacity FROM Stations ORDER BY id`
    );
    const stationsBikeCounts = stationRows.map((s) => ({
      id: s.id,
      name: s.name,
      available: Number(s.available || 0),
      capacity: Number(s.capacity || 0),
    }));

    // Reports -> counts per status
    const reportStatusRows = await query(
      `SELECT status, COUNT(*) as count FROM Reports GROUP BY status`
    );
    const reportCounts = reportStatusRows.map((r) => ({
      status: r.status,
      count: Number(r.count || 0),
    }));

    const totalReports = reportCounts.reduce((s, r) => s + r.count, 0);
    // Treat anything with status === 'resolved' as handled; others considered processing
    const resolvedCount = reportCounts
      .filter((r) => (r.status || "").toLowerCase() === "resolved")
      .reduce((s, r) => s + r.count, 0);
    const processingCount = totalReports - resolvedCount;
    const resolvedPercent =
      totalReports === 0 ? 0 : Math.round((resolvedCount / totalReports) * 100);
    const processingPercent = totalReports === 0 ? 0 : 100 - resolvedPercent;

    res.json({
      usersAgeBuckets,
      stationsBikeCounts,
      reports: {
        counts: reportCounts,
        total: totalReports,
        resolvedCount,
        processingCount,
        resolvedPercent,
        processingPercent,
      },
    });
  } catch (err) {
    console.error("Error building visualization summary:", err);
    res.status(500).json({ error: "Failed to build visualization summary" });
  }
});

module.exports = router;

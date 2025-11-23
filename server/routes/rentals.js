const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const { query, pool } = require("../db");

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

// Rent a bike from stationId
router.post("/rent", auth, async (req, res) => {
  const { stationId } = req.body;
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [sRows] = await conn.execute(
      "SELECT * FROM Stations WHERE id = ? FOR UPDATE",
      [stationId]
    );
    const station = sRows[0];
    if (!station) {
      await conn.rollback();
      return res.status(404).json({ error: "Station not found" });
    }
    if (!station.open) {
      await conn.rollback();
      return res.status(400).json({ error: "Station closed" });
    }
    if (station.available <= 0) {
      await conn.rollback();
      return res.status(400).json({ error: "No bikes available" });
    }

    await conn.execute(
      "UPDATE Stations SET available = available - 1 WHERE id = ?",
      [stationId]
    );
    const [r] = await conn.execute(
      "INSERT INTO Rentals (UserId, fromStationId) VALUES (?, ?)",
      [req.user.id, stationId]
    );
    await conn.commit();
    res.json({ rentalId: r.insertId, status: "active" });
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
});

// Return a bike to a station
router.post("/return", auth, async (req, res) => {
  const { rentalId, stationId } = req.body;
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [rRows] = await conn.execute(
      "SELECT * FROM Rentals WHERE id = ? FOR UPDATE",
      [rentalId]
    );
    const rental = rRows[0];
    if (!rental) {
      await conn.rollback();
      return res.status(404).json({ error: "Rental not found" });
    }
    if (rental.UserId !== req.user.id) {
      await conn.rollback();
      return res.status(403).json({ error: "Forbidden" });
    }
    if (rental.status !== "active") {
      await conn.rollback();
      return res.status(400).json({ error: "Rental already returned" });
    }

    const [sRows] = await conn.execute(
      "SELECT * FROM Stations WHERE id = ? FOR UPDATE",
      [stationId]
    );
    const station = sRows[0];
    if (!station) {
      await conn.rollback();
      return res.status(404).json({ error: "Station not found" });
    }
    if (station.available >= station.capacity) {
      await conn.rollback();
      return res.status(400).json({ error: "Station full" });
    }

    await conn.execute(
      "UPDATE Stations SET available = available + 1 WHERE id = ?",
      [stationId]
    );
    await conn.execute(
      "UPDATE Rentals SET status = ?, toStationId = ?, endedAt = ? WHERE id = ?",
      ["returned", stationId, new Date(), rentalId]
    );
    await conn.commit();
    res.json({ rentalId: rentalId, status: "returned" });
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
});

// List current user's rentals
router.get("/me", auth, async (req, res) => {
  const rentals = await query(
    `SELECT r.*, fs.id as from_id, fs.name as from_name, ts.id as to_id, ts.name as to_name
     FROM Rentals r
     LEFT JOIN Stations fs ON r.fromStationId = fs.id
     LEFT JOIN Stations ts ON r.toStationId = ts.id
     WHERE r.UserId = ?`,
    [req.user.id]
  );
  res.json(rentals);
});

module.exports = router;

const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { query } = require("../db");

const JWT_SECRET = process.env.JWT_SECRET || "secret-change-me";

router.post("/register", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password)
    return res.status(400).json({ error: "Missing fields" });
  const rows = await query("SELECT id FROM Users WHERE username = ?", [
    username,
  ]);
  if (rows.length) return res.status(400).json({ error: "User exists" });
  const hash = await bcrypt.hash(password, 10);
  const r = await query(
    "INSERT INTO Users (username, passwordHash) VALUES (?, ?)",
    [username, hash]
  );
  // mysql2 returns insertId in result object when using execute via pool.execute
  // our helper returns rows only for SELECT; when inserting, execute returns result set object — handle via direct pool
  // but pool.execute returns [rows, fields] where rows contains insertId for insert queries.
  res.json({ id: r.insertId || undefined, username });
});

router.post("/login", async (req, res) => {
  const { username, password } = req.body;
  const rows = await query("SELECT * FROM Users WHERE username = ?", [
    username,
  ]);
  const user = rows[0];
  if (!user) return res.status(401).json({ error: "Invalid credentials" });
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(401).json({ error: "Invalid credentials" });

  // Debug: log user info
  console.log("Login user:", {
    id: user.id,
    username: user.username,
    role: user.role,
  });

  // If username is admin but role is not admin, update it
  if (username === "admin" && user.role !== "admin") {
    await query("UPDATE Users SET role = ? WHERE id = ?", ["admin", user.id]);
    console.log("Updated admin role for user:", username);
    user.role = "admin";
  }

  const token = jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
  res.json({
    token,
    user: { id: user.id, username: user.username, role: user.role },
  });
});

module.exports = router;

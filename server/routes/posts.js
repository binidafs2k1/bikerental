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

// Edit post (user can update title/content)
router.put("/:id", auth, async (req, res) => {
  const { id } = req.params;
  const { title, content } = req.body;
  const rows = await query("SELECT * FROM Posts WHERE id = ?", [id]);
  const post = rows[0];
  if (!post) return res.status(404).json({ error: "Not found" });
  if (post.UserId !== req.user.id)
    return res.status(403).json({ error: "Forbidden" });

  const newTitle = title !== undefined ? title : post.title;
  const newContent = content !== undefined ? content : post.content;
  await query("UPDATE Posts SET title = ?, content = ? WHERE id = ?", [
    newTitle,
    newContent,
    id,
  ]);

  const updatedRows = await query(
    `SELECT p.*, u.id as user_id, u.username as user_username FROM Posts p LEFT JOIN Users u ON p.UserId = u.id WHERE p.id = ?`,
    [id]
  );
  const p = updatedRows[0];
  res.json({
    ...p,
    User: p.user_id ? { id: p.user_id, username: p.user_username } : null,
  });
});

// Delete post (user can delete their own)
router.delete("/:id", auth, async (req, res) => {
  const { id } = req.params;
  const postRows = await query("SELECT * FROM Posts WHERE id = ?", [id]);
  const post = postRows[0];
  if (!post) return res.status(404).json({ error: "Not found" });
  if (post.UserId !== req.user.id)
    return res.status(403).json({ error: "Forbidden" });
  await query("DELETE FROM Posts WHERE id = ?", [id]);
  res.json({ success: true });
});

router.get("/", async (req, res) => {
  const rows = await query(`
    SELECT p.*, u.id as user_id, u.username as user_username
    FROM Posts p
    LEFT JOIN Users u ON p.UserId = u.id
  `);
  // map to previous Sequelize-like shape: include nested User object
  const posts = rows.map((p) => ({
    ...p,
    User: p.user_id ? { id: p.user_id, username: p.user_username } : null,
  }));
  res.json(posts);
});

router.post("/", auth, async (req, res) => {
  const { title, content } = req.body;
  const result = await query(
    "INSERT INTO Posts (title, content, UserId) VALUES (?, ?, ?)",
    [title, content, req.user.id]
  );
  // fetch created row with user info
  const rows = await query(
    `SELECT p.*, u.id as user_id, u.username as user_username FROM Posts p LEFT JOIN Users u ON p.UserId = u.id WHERE p.id = ?`,
    [result.insertId]
  );
  const p = rows[0];
  res.json({
    ...p,
    User: p.user_id ? { id: p.user_id, username: p.user_username } : null,
  });
});

module.exports = router;

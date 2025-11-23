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
  const post = await Post.findByPk(id);
  if (!post) return res.status(404).json({ error: "Not found" });
  if (post.UserId !== req.user.id)
    return res.status(403).json({ error: "Forbidden" });
  if (title) post.title = title;
  if (content) post.content = content;
  await post.save();
  await query("UPDATE Posts SET title = ?, content = ? WHERE id = ?", [
    title || post.title,
    content || post.content,
    id,
  ]);
  const updated = await query("SELECT * FROM Posts WHERE id = ?", [id]);
  res.json(updated[0]);
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
  const posts = await query(`
    SELECT p.*, u.id as user_id, u.username as user_username
    FROM Posts p
    LEFT JOIN Users u ON p.UserId = u.id
  `);
  res.json(posts);
});

router.post("/", auth, async (req, res) => {
  const { title, content } = req.body;
  const result = await query(
    "INSERT INTO Posts (title, content, UserId) VALUES (?, ?, ?)",
    [title, content, req.user.id]
  );
  const inserted = await query("SELECT * FROM Posts WHERE id = ?", [
    result.insertId,
  ]);
  res.json(inserted[0]);
});

module.exports = router;

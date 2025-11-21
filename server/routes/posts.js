const express = require("express");
const router = express.Router();
const { Post, User } = require("../models");
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

router.get("/", async (req, res) => {
  const posts = await Post.findAll({
    include: [{ model: User, attributes: ["id", "username"] }],
  });
  res.json(posts);
});

router.post("/", auth, async (req, res) => {
  const { title, content } = req.body;
  const post = await Post.create({ title, content, UserId: req.user.id });
  res.json(post);
});

module.exports = router;

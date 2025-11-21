const express = require("express");
const router = express.Router();
const { Report, Station, User } = require("../models");
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
  const reports = await Report.findAll({ include: [Station, User] });
  res.json(reports);
});

router.post("/", auth, async (req, res) => {
  const { stationId, description } = req.body;
  const r = await Report.create({
    StationId: stationId,
    UserId: req.user.id,
    description,
  });
  res.json(r);
});

module.exports = router;

const express = require("express");
const router = express.Router();
const { Station } = require("../models");

router.get("/", async (req, res) => {
  const stations = await Station.findAll();
  res.json(stations);
});

router.get("/:id", async (req, res) => {
  const s = await Station.findByPk(req.params.id);
  if (!s) return res.status(404).json({ error: "Not found" });
  res.json(s);
});

// toggle open/close - expects admin or authorized client in production
router.put("/:id/toggle", async (req, res) => {
  const s = await Station.findByPk(req.params.id);
  if (!s) return res.status(404).json({ error: "Not found" });
  s.open = !s.open;
  await s.save();
  res.json(s);
});

module.exports = router;

const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { Station, Rental, User } = require('../models');

const JWT_SECRET = process.env.JWT_SECRET || 'secret-change-me';

function auth(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: 'No token' });
  const token = auth.split(' ')[1];
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

// Rent a bike from stationId
router.post('/rent', auth, async (req, res) => {
  const { stationId } = req.body;
  const station = await Station.findByPk(stationId);
  if (!station) return res.status(404).json({ error: 'Station not found' });
  if (!station.open) return res.status(400).json({ error: 'Station closed' });
  if (station.available <= 0) return res.status(400).json({ error: 'No bikes available' });

  // decrement available
  station.available = station.available - 1;
  await station.save();

  const rental = await Rental.create({ UserId: req.user.id, fromStationId: station.id });
  res.json({ rentalId: rental.id, status: rental.status });
});

// Return a bike to a station
router.post('/return', auth, async (req, res) => {
  const { rentalId, stationId } = req.body;
  const rental = await Rental.findByPk(rentalId);
  if (!rental) return res.status(404).json({ error: 'Rental not found' });
  if (rental.UserId !== req.user.id) return res.status(403).json({ error: 'Forbidden' });
  if (rental.status !== 'active') return res.status(400).json({ error: 'Rental already returned' });

  const station = await Station.findByPk(stationId);
  if (!station) return res.status(404).json({ error: 'Station not found' });
  if (station.available >= station.capacity) return res.status(400).json({ error: 'Station full' });

  station.available = station.available + 1;
  await station.save();

  rental.status = 'returned';
  rental.toStationId = station.id;
  rental.endedAt = new Date();
  await rental.save();

  res.json({ rentalId: rental.id, status: rental.status });
});

// List current user's rentals
router.get('/me', auth, async (req, res) => {
  const rentals = await Rental.findAll({ where: { UserId: req.user.id }, include: [{ model: Station, as: 'fromStation' }, { model: Station, as: 'toStation' }] });
  res.json(rentals);
});

module.exports = router;

const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { User } = require('../models');

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

router.get('/', auth, async (req, res) => {
  const user = await User.findByPk(req.user.id, { attributes: ['id', 'username', 'role'] });
  res.json(user);
});

router.put('/', auth, async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findByPk(req.user.id);
  if (!user) return res.status(404).json({ error: 'Not found' });
  if (username) user.username = username;
  if (password) user.passwordHash = await bcrypt.hash(password, 10);
  await user.save();
  res.json({ id: user.id, username: user.username });
});

module.exports = router;

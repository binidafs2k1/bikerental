require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { sequelize, User, Station, Post, Report } = require("./models");
const authRoutes = require("./routes/auth");
const adminRoutes = require("./routes/admin");
const stationsRoutes = require("./routes/stations");
const postsRoutes = require("./routes/posts");
const reportsRoutes = require("./routes/reports");

const app = express();
app.use(cors());
app.use(express.json());

app.use("/auth", authRoutes);
const profileRoutes = require('./routes/profile');
const statsRoutes = require('./routes/stats');
const rentalsRoutes = require('./routes/rentals');
app.use("/admin", adminRoutes);
app.use("/stations", stationsRoutes);
app.use("/posts", postsRoutes);
app.use("/reports", reportsRoutes);
app.use('/profile', profileRoutes);
app.use('/stats', statsRoutes);
app.use('/rentals', rentalsRoutes);

const PORT = process.env.PORT || 4000;

async function start() {
  await sequelize.sync();

  // seed a default admin if not exists (credentials configurable via .env)
  const adminUser = process.env.ADMIN_USER || 'admin';
  const adminPass = process.env.ADMIN_PASS || 'adminpass';
  const admin = await User.findOne({ where: { username: adminUser } });
  if (!admin) {
    const hash = await bcrypt.hash(adminPass, 10);
    await User.create({ username: adminUser, passwordHash: hash, role: 'admin' });
    console.log(`Seeded default admin -> username: ${adminUser}, password: ${adminPass}`);
  }

  // seed some stations
  const count = await Station.count();
  if (count === 0) {
    await Station.bulkCreate([
      {
        name: "Station A",
        lat: 37.5665,
        lng: 126.978,
        capacity: 20,
        available: 8,
      },
      {
        name: "Station B",
        lat: 37.5651,
        lng: 126.9895,
        capacity: 15,
        available: 5,
      },
      {
        name: "Station C",
        lat: 37.57,
        lng: 126.982,
        capacity: 12,
        available: 12,
      },
    ]);
    console.log("Seeded sample stations");
  }

  app.listen(PORT, () => console.log(`Server listening on ${PORT}`));
}

start().catch((err) => {
  console.error(err);
  process.exit(1);
});

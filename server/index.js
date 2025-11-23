require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { init: dbInit } = require("./db");
const authRoutes = require("./routes/auth");
const adminRoutes = require("./routes/admin");
const stationsRoutes = require("./routes/stations");
const postsRoutes = require("./routes/posts");
const reportsRoutes = require("./routes/reports");

const app = express();
app.use(cors());
app.use(express.json());

app.use("/auth", authRoutes);
const profileRoutes = require("./routes/profile");
const statsRoutes = require("./routes/stats");
const rentalsRoutes = require("./routes/rentals");
const favoritesRoutes = require("./routes/favorites");
app.use("/admin", adminRoutes);
app.use("/stations", stationsRoutes);
app.use("/posts", postsRoutes);
app.use("/reports", reportsRoutes);
app.use("/profile", profileRoutes);
app.use("/stats", statsRoutes);
app.use("/rentals", rentalsRoutes);
app.use("/favorites", favoritesRoutes);

const PORT = process.env.PORT || 4000;

async function start() {
  await dbInit();

  app.listen(PORT, () => console.log(`Server listening on ${PORT}`));
}

start().catch((err) => {
  console.error(err);
  process.exit(1);
});

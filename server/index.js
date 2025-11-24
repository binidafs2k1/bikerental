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

  // Optional: automatic import from sample (or real provider) every minute.
  // Enable via env: DDARUNGI_SAMPLE_ENABLED=true (no auth) OR DDARUNGI_ENABLED=true when using real API + key.
  try {
    const enabledSample = (process.env.DDARUNGI_SAMPLE_ENABLED || "").toLowerCase() === "true";
    const enabled = (process.env.DDARUNGI_ENABLED || "").toLowerCase() === "true";
    if (enabledSample || enabled) {
      const { importSeoulSample } = require("./scripts/importSeoulSample");
      const runImport = async () => {
        try {
          console.log("Starting scheduled Ddarungi import...");
          const url = process.env.DDARUNGI_SAMPLE_URL || process.env.DDARUNGI_API_URL;
          const res = await importSeoulSample(url);
          console.log("Ddarungi import finished:", res);
        } catch (e) {
          console.error("Scheduled import error:", e.message || e);
        }
      };
      // initial run
      setTimeout(runImport, 2000);
      // schedule every minute
      setInterval(runImport, 60 * 1000);
    }
  } catch (e) {
    console.error("Failed to schedule Ddarungi imports:", e.message || e);
  }

  app.listen(PORT, () => console.log(`Server listening on ${PORT}`));
}

start().catch((err) => {
  console.error(err);
  process.exit(1);
});

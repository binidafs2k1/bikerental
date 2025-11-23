require("dotenv").config();
const { query } = require("../db");
(async () => {
  try {
    const rows = await query("SHOW TABLES LIKE 'Favorites'");
    console.log("favorites table check:", rows);
    const sample = await query("SELECT * FROM Favorites LIMIT 3");
    console.log("sample rows:", sample);
    process.exit(0);
  } catch (e) {
    console.error("error:", e.message || e);
    process.exit(1);
  }
})();

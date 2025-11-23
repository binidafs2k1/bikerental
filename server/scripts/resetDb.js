const { getPool, query, init } = require("../db");

async function resetAll() {
  const pool = await getPool();
  const conn = await pool.getConnection();
  try {
    console.log("Dropping tables (if exist)");
    await conn.query("SET FOREIGN_KEY_CHECKS = 0");
    await conn.query("DROP TABLE IF EXISTS Rentals");
    await conn.query("DROP TABLE IF EXISTS Reports");
    await conn.query("DROP TABLE IF EXISTS Posts");
    await conn.query("DROP TABLE IF EXISTS Stations");
    await conn.query("DROP TABLE IF EXISTS Users");
    await conn.query("SET FOREIGN_KEY_CHECKS = 1");
    console.log("Dropped. Re-initializing schema...");
    await init();
    console.log("Database reset + seeded.");
  } catch (err) {
    console.error("Reset failed:", err.message);
    process.exit(1);
  } finally {
    conn.release();
    process.exit(0);
  }
}

resetAll();

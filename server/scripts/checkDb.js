// Quick script to check DB connectivity. Uses environment variables.
const { getPool } = require("../db");

async function check() {
  const pool = await getPool();
  const conn = await pool.getConnection();
  try {
    const [rows] = await conn.execute("SELECT 1+1 AS ok");
    console.log("DB connection OK:", rows[0]);
  } finally {
    conn.release();
    process.exit(0);
  }
}

check().catch((err) => {
  console.error("DB check failed:", err.message);
  process.exit(1);
});

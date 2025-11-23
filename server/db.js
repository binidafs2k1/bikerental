const mysql = require("mysql2/promise");
const bcrypt = require("bcrypt");

// Build connection config from DATABASE_URL or granular env vars
function makePoolConfig() {
  if (process.env.DATABASE_URL) return { url: process.env.DATABASE_URL };
  const config = {
    host: process.env.DB_HOST || "127.0.0.1",
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASS || "",
    database: process.env.DB_NAME || "bikerental",
    waitForConnections: true,
    connectionLimit: Number(process.env.DB_CONN_LIMIT || 10),
  };
  // Ensure database exists (attempt to create it if allowed by the user)
  // Connect without specifying database first
  async function ensureDatabase() {
    const needDb = Boolean(config.database);
    if (!needDb) return;
    // create a temporary connection to create the DB if necessary
    const tmpCfg = Object.assign({}, config);
    delete tmpCfg.database;
    try {
      const conn = await mysql.createConnection(tmpCfg);
      // Use backticks for DB name to allow hyphens/underscores
      await conn.query(
        `CREATE DATABASE IF NOT EXISTS \`${config.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
      );
      await conn.end();
    } catch (err) {
      // if DB creation fails, surface the error when pool tries to connect later
      console.warn(
        "Could not create database automatically (you may need to create it manually):",
        err.message
      );
    }
  }

  // run ensure step synchronously before creating pool
  // Note: makePool is not async in current code; run ensureDatabase synchronously via immediate invocation
  // (it's safe because it just starts the asynchronous creation; pool creation follows)
  ensureDatabase().catch(() => {});

  return config;
}
let pool = null;

async function ensurePool() {
  if (pool) return pool;

  const cfg = makePoolConfig();

  if (cfg.url) {
    // simple URL-based pool
    pool = mysql.createPool(cfg.url);
    return pool;
  }

  // cfg is an object for granular connection
  // create pool and test; if DB doesn't exist, attempt to create it
  try {
    pool = mysql.createPool(cfg);
    // test a simple query
    await pool.execute("SELECT 1");
    return pool;
  } catch (err) {
    if (err && err.code === "ER_BAD_DB_ERROR") {
      // database missing — try to create it if possible
      console.log(
        `Database '${cfg.database}' not found — attempting to create it...`
      );
      try {
        const tmpCfg = Object.assign({}, cfg);
        delete tmpCfg.database;
        const tmpConn = await mysql.createConnection(tmpCfg);
        await tmpConn.query(
          `CREATE DATABASE IF NOT EXISTS \`${cfg.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
        );
        await tmpConn.end();
        // recreate pool after DB created
        pool = mysql.createPool(cfg);
        await pool.execute("SELECT 1");
        console.log(`Database '${cfg.database}' created and connected.`);
        return pool;
      } catch (createErr) {
        // surface clear error
        const msg = `Unable to create database '${cfg.database}': ${createErr.message}`;
        throw new Error(msg);
      }
    }
    throw err;
  }
}

async function getPool() {
  return await ensurePool();
}

async function query(sql, params) {
  const p = await ensurePool();
  const [rows] = await p.execute(sql, params);
  return rows;
}

// Initialize schema if missing (safe to call repeatedly)
async function init() {
  // Create tables using SQL compatible with MySQL
  await query(`
    CREATE TABLE IF NOT EXISTS Users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      username VARCHAR(255) NOT NULL UNIQUE,
      passwordHash VARCHAR(255) NOT NULL,
      role VARCHAR(50) NOT NULL DEFAULT 'user'
    );
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS Stations (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      lat DOUBLE NOT NULL,
      lng DOUBLE NOT NULL,
      capacity INT NOT NULL DEFAULT 10,
      open BOOLEAN DEFAULT TRUE,
      available INT DEFAULT 0
    );
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS Posts (
      id INT AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      content TEXT NOT NULL,
      UserId INT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (UserId) REFERENCES Users(id) ON DELETE SET NULL
    );
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS Reports (
      id INT AUTO_INCREMENT PRIMARY KEY,
      description TEXT NOT NULL,
      status VARCHAR(50) NOT NULL DEFAULT 'open',
      StationId INT,
      UserId INT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (StationId) REFERENCES Stations(id) ON DELETE SET NULL,
      FOREIGN KEY (UserId) REFERENCES Users(id) ON DELETE SET NULL
    );
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS Rentals (
      id INT AUTO_INCREMENT PRIMARY KEY,
      status VARCHAR(50) NOT NULL DEFAULT 'active',
      startedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      endedAt DATETIME DEFAULT NULL,
      UserId INT,
      fromStationId INT,
      toStationId INT,
      FOREIGN KEY (UserId) REFERENCES Users(id) ON DELETE SET NULL,
      FOREIGN KEY (fromStationId) REFERENCES Stations(id) ON DELETE SET NULL,
      FOREIGN KEY (toStationId) REFERENCES Stations(id) ON DELETE SET NULL
    );
  `);

  // Favorites table for storing user favorite stations
  await query(`
      CREATE TABLE IF NOT EXISTS Favorites (
        id INT AUTO_INCREMENT PRIMARY KEY,
        UserId INT,
        StationId INT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (UserId) REFERENCES Users(id) ON DELETE CASCADE,
        FOREIGN KEY (StationId) REFERENCES Stations(id) ON DELETE CASCADE
      );
    `);

  // Seed default admin if missing
  const adminUser = process.env.ADMIN_USER || "admin";
  const adminPass = process.env.ADMIN_PASS || "adminpass";
  const users = await query("SELECT id FROM Users WHERE username = ?", [
    adminUser,
  ]);
  if (users.length === 0) {
    const hash = await bcrypt.hash(adminPass, 10);
    await query(
      "INSERT INTO Users (username, passwordHash, role) VALUES (?, ?, ?)",
      [adminUser, hash, "admin"]
    );
    console.log(`Seeded default admin -> username: ${adminUser}`);
  }

  // Seed sample stations if none
  const stations = await query("SELECT COUNT(*) as c FROM Stations");
  if (stations[0].c === 0) {
    await query(
      "INSERT INTO Stations (name, lat, lng, capacity, available) VALUES (?, ?, ?, ?, ?)",
      ["Station A", 37.5665, 126.978, 20, 8]
    );
    await query(
      "INSERT INTO Stations (name, lat, lng, capacity, available) VALUES (?, ?, ?, ?, ?)",
      ["Station B", 37.5651, 126.9895, 15, 5]
    );
    await query(
      "INSERT INTO Stations (name, lat, lng, capacity, available) VALUES (?, ?, ?, ?, ?)",
      ["Station C", 37.57, 126.982, 12, 12]
    );
    console.log("Seeded sample stations");
  }
}

module.exports = { getPool, query, init, ensurePool };

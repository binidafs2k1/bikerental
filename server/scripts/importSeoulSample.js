const { query } = require("../db");

// Default sample URL; can be overridden with DDARUNGI_SAMPLE_URL
const DEFAULT_SAMPLE_URL =
  process.env.DDARUNGI_SAMPLE_URL ||
  "http://openapi.seoul.go.kr:8088/sample/json/bikeList/1/5/";

async function fetchJson(url) {
  // Use global fetch when available
  if (typeof fetch === "function") {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
    return await res.json();
  }

  // Fallback to built-in node https if fetch isn't available
  return new Promise((resolve, reject) => {
    const https = require("https");
    const u = new URL(url);
    https
      .get(
        {
          hostname: u.hostname,
          path: u.pathname + u.search,
          port: u.port || 443,
          method: "GET",
        },
        (res) => {
          let data = "";
          res.on("data", (chunk) => (data += chunk));
          res.on("end", () => {
            try {
              resolve(JSON.parse(data));
            } catch (e) {
              reject(e);
            }
          });
        }
      )
      .on("error", reject);
  });
}

function toNum(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

async function importSeoulSample(url = DEFAULT_SAMPLE_URL) {
  const result = { fetched: 0, imported: 0, updated: 0, errors: [] };
  try {
    const json = await fetchJson(url);
    const payload = json?.rentBikeStatus;
    if (!payload) throw new Error("Unexpected payload structure");
    const rows = payload.row || payload.rows || [];
    result.fetched = rows.length;

    for (const item of rows) {
      try {
        const srcId = String(item.stationId || item.STATION_ID || item.id || "");
        if (!srcId) continue;
        const name = item.stationName || item.STATION_NAME || item.name || "Unknown";
        const lat = toNum(item.stationLatitude || item.latitude || item.lat);
        const lng = toNum(item.stationLongitude || item.longitude || item.lng);
        const capacity = toNum(item.rackTotCnt) ?? 10;
        const available = toNum(item.parkingBikeTotCnt) ?? 0;
        const shared = item.shared || null;

        // Attempt to find existing by source + sourceId
        const existing = await query(
          "SELECT id FROM Stations WHERE source = ? AND sourceId = ?",
          ["ddarungi", srcId]
        );

        if (existing && existing.length > 0) {
          const id = existing[0].id;
          await query(
            "UPDATE Stations SET name = ?, lat = ?, lng = ?, capacity = ?, available = ?, shared = ?, lastImportedAt = NOW() WHERE id = ?",
            [name, lat ?? 0, lng ?? 0, capacity, available, shared, id]
          );
          result.updated += 1;
        } else {
          await query(
            "INSERT INTO Stations (name, lat, lng, capacity, available, source, sourceId, shared, lastImportedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())",
            [name, lat ?? 0, lng ?? 0, capacity, available, "ddarungi", srcId, shared]
          );
          result.imported += 1;
        }
      } catch (e) {
        result.errors.push(e.message || String(e));
      }
    }
  } catch (err) {
    result.errors.push(err.message || String(err));
  }

  return result;
}

module.exports = { importSeoulSample };

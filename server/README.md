## Server (Express + MySQL)

Quick start (short):

1. Install & copy example env:

```powershell
cd server
npm install
copy .env.example .env
# edit .env to set DB_USER/DB_PASS/DB_NAME or DATABASE_URL (do NOT commit .env)
```

2. Check DB connectivity:

```powershell
npm run db:check
```

3. (Optional) Start fresh: drop tables and re-seed defaults:

```powershell
npm run db:reset
```

4. Start server:

```powershell
npm run start
```

Notes:

- Default admin account is seeded: username `admin`, password `adminpass` (change via .env).
- Supported DB config: use either DATABASE_URL or DB_HOST/DB_USER/DB_PASS/DB_NAME in `.env`.
- The server will create missing tables automatically when it starts (or when you run `db:reset`).
- API routes (examples): POST `/auth/register`, POST `/auth/login`, GET `/stations`, GET `/posts`, GET `/reports`, and admin routes under `/admin` (needs Bearer token).

- Import sample API: You can trigger an import of the sample Seoul bike API (or set a custom URL) via POST `/admin/import/ddarungi` (admin-only). This will upsert stations into the `Stations` table and set `source='ddarungi'` + `sourceId`.

- Automatic imports: you can enable scheduled imports every 60s by setting `DDARUNGI_SAMPLE_ENABLED=true` (uses the sample URL) or `DDARUNGI_ENABLED=true` (uses DDARUNGI_API_URL / API key when available). See the scripts/importSeoulSample.js implementation for mapping details.
- New admin visualization route (for admin UI / D3): `GET /admin/visualization` — returns aggregation data (admin-only).

Example response:

```json
{
  "usersAgeBuckets": [
    { "bucket": "0-9", "count": 2 },
    { "bucket": "10-19", "count": 5 }
  ],
  "stationsBikeCounts": [
    { "id": 1, "name": "Station A", "available": 8, "capacity": 20 }
  ],
  "reports": {
    "counts": [
      { "status": "open", "count": 4 },
      { "status": "resolved", "count": 1 }
    ],
    "total": 5,
    "resolvedCount": 1,
    "processingCount": 4,
    "resolvedPercent": 20,
    "processingPercent": 80
  }
}
```

Notes:

- This endpoint is protected by the admin token middleware (send Authorization: Bearer <token>).
- Use these aggregates in admin visualization pages (e.g., D3.js charts). Adjust grouping or filters on the client if you need different buckets.
- OpenAPI spec: `server/swagger.yaml` (you can open it in https://editor.swagger.io/)

Keep `.env` private (do not push credentials).

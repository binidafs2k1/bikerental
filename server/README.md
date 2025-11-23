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
- OpenAPI spec: `server/swagger.yaml` (you can open it in https://editor.swagger.io/)

Keep `.env` private (do not push credentials).

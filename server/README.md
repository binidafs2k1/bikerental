# Server (Express + SQLite)

Prereqs: Node.js installed.

Install dependencies and start:

```powershell
cd server
npm install
cp .env.example .env
# edit .env if you want
npm run start
```

Default seeded admin: by default `username: admin`, `password: adminpass`.
You can change the admin credentials by copying `.env.example` to `.env` and editing `ADMIN_USER` and `ADMIN_PASS` before starting the server.

Example (`.env`):
```
ADMIN_USER=admin
ADMIN_PASS=adminpass
JWT_SECRET=your-secret-here
```

APIs:

- `POST /auth/register` {username,password}
- `POST /auth/login` {username,password} -> {token}
- `GET /stations`
- `GET /posts`
- `GET /reports`
- Admin endpoints under `/admin` require `Authorization: Bearer <token>` and admin role.

# IWC Concepts — Platform

Event management, speaker database, registration forms, flyer studio, and programs — all in one place.

---

## Architecture

```
browser (React + Vite)
    │
    │  /api/*  (same origin in prod; proxied :5173 → :3001 in dev)
    │
Express server  (server/index.js)
    │
    ├── POST /api/db            ← all CRUD via pg (any PostgreSQL)
    ├── POST /api/cloudinary-sign
    ├── GET  /api/shorten
    ├── GET  /api/health
    └── static → dist/          ← built Vite app (single-service mode)
```

**Database**: any PostgreSQL — Supabase, Neon, Railway, local, your own VPS.  
Change `DATABASE_URL` and nothing else to switch databases.

**Auth**: Supabase Auth (separate from the database). The browser calls `supabase.auth.*` for login; the server verifies the resulting JWT locally using `SUPABASE_JWT_SECRET` (no network call per request).

---

## Local development

### 1. Install dependencies
```bash
npm install
cd server && npm install
```

### 2. Configure
```bash
# Frontend auth (optional — can also enter in the Database Setup UI)
cp .env.example .env
# fill in VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY

# Backend
cp server/.env.example server/.env
# fill in DATABASE_URL, SUPABASE_JWT_SECRET, Cloudinary vars
```

### 3. Create database tables
Run the SQL in the **Database Setup** page (`/db-setup` in the app).  
Plain SQL — works on any PostgreSQL (Supabase SQL Editor, psql, pgAdmin, Neon console, etc.).

### 4. Run
```bash
npm run dev    # starts Vite (port 5173) + Express (port 3001) concurrently
```

---

## Deploy to Render (single service)

The repo includes `render.yaml` for one-click Blueprint deployment.

**Manual setup:**
1. Render → **New Web Service** → connect GitHub repo
2. Leave root directory blank
3. **Build command**: `npm install && npm run build && cd server && npm install`
4. **Start command**: `node server/index.js`
5. Add env vars:

| Variable | Where to find it |
|---|---|
| `DATABASE_URL` | Your PostgreSQL provider's connection string |
| `SUPABASE_JWT_SECRET` | Supabase → Settings → API → JWT Settings |
| `CLOUDINARY_CLOUD_NAME/API_KEY/API_SECRET` | cloudinary.com → Dashboard |
| `VITE_SUPABASE_URL` | Supabase → Settings → API → Project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase → Settings → API → anon public |

Health check endpoint: `GET /api/health`

---

## Switching databases

1. Create a PostgreSQL database anywhere (Neon, Railway, Supabase, local…)
2. Run the SQL schema (Database Setup page)
3. Update `DATABASE_URL` — that's it. No code changes.

---

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite 5, React Router 6 |
| Backend | Node.js, Express 4 |
| Database | Any PostgreSQL via `pg` (node-postgres) |
| Auth | Supabase Auth + `jsonwebtoken` (local JWT verification) |
| Images | Cloudinary (signed upload) with canvas-resize fallback |
| Email | EmailJS |
| URL shortener | TinyURL |

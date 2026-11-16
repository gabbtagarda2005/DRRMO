# DRRMO: Integrated Disaster Response Platform

A full-stack disaster risk reduction and emergency response platform for Philippine municipalities. It connects citizens, barangay officials, field responders and the municipal DRRMO command center in real time.

**→ To put it online, follow [DEPLOYMENT.md](DEPLOYMENT.md)** (Render + Vercel + MongoDB Atlas).

## What's in the repo

| Folder | What it is | Local URL | Deploys to |
|---|---|---|---|
| `backend/` | Express + TypeScript REST API, Socket.IO realtime, MongoDB (Mongoose) | http://localhost:5000 | Render |
| `frontend/landing/` | Public landing page with live municipal status | http://localhost:3005 | Vercel |
| `frontend/admin-app/` | **System Admin**: users and roles, system health, audit log, reports | http://localhost:3000 | Vercel |
| `frontend/drrmo-officer-app/` | **DRRMO Officer** command center: incidents, map, responders, shelters, resources, alerts, reports | http://localhost:3001 | Vercel |
| `frontend/barangay-app/` | **Barangay Official**: local incidents and escalation, shelters, damage assessments, assistance requests, advisories | http://localhost:3003 | Vercel |
| `frontend/shared-ui/` | Shared React components (app shell, modals, evacuation board, alert center, report center…) | — | bundled into each app |
| `shared/` | Shared TypeScript: API client, typed services, constants, formatting, CSV exports | — | bundled into each app |
| `mobile/` | Flutter apps for **citizens** and **responders** (plus shared `drrmo_core`) | — | Android APK |

## Tech stack

- **Web:** React 18, TanStack Router + Query, Tailwind CSS, Leaflet, Vite
- **API:** Node 20+, Express, Mongoose, Socket.IO, JWT, express-validator, Helmet, rate limiting
- **Database:** MongoDB (Atlas in production)
- **Mobile:** Flutter

## Run it locally

Prerequisites: Node 20+, and MongoDB running on `localhost:27017`.

```bash
# 1. API
cd backend
cp .env.example .env          # then edit JWT_SECRET
npm install
npm run seed:demo             # demo accounts + sample incidents, shelters, resources
npm run dev                   # http://localhost:5000

# 2. Any web app (separate terminals)
cd frontend/drrmo-officer-app && npm install && npm run dev    # :3001
cd frontend/admin-app         && npm install && npm run dev    # :3000
cd frontend/barangay-app      && npm install && npm run dev    # :3003
cd frontend/landing           && npm install && npm run dev    # :3005
```

On Windows you can also use `run-all.bat`.

### Demo accounts (password `DRRMO123`)

| Role | Email | Use in |
|---|---|---|
| Admin | `admin@drmmo.gov.ph` | Admin portal |
| DRRMO Officer | `officer1@drmmo.gov.ph` | Officer portal |
| Barangay Official | `barangay1@drmmo.gov.ph` | Barangay portal (Barangay Centro) |
| Responder | `responder1@drmmo.gov.ph` | Responder mobile app |
| Citizen | `citizen1@email.com` | Citizen mobile app |

Each portal only accepts accounts with its own role.

## Security model

- **Self-registration** (`POST /api/auth/register`) always creates a **citizen**. Privileged roles are assigned only by an administrator.
- Users can edit only their own name, phone and avatar. Role and active status are admin-only.
- **Suspended accounts** cannot sign in.
- Barangay officials are scoped to **their own barangay**: incidents they escalate, shelters they edit, and advisories they send.
- Responders can update only **their own** status and location.
- Every sign-in and change is written to the **audit log**. Passwords are never logged.
- In production the API refuses to start without `JWT_SECRET` and `MONGODB_URI`, and CORS allows only the origins in `CORS_ORIGIN` (wildcards such as `https://drrmo-*.vercel.app` are supported).

## Useful API endpoints

| Endpoint | Auth | Purpose |
|---|---|---|
| `GET /api/health` | public | Liveness + database status (used by Render) |
| `GET /api/public/overview` | public | Aggregate counts for the landing page (no personal data) |
| `GET /api/system/health` | admin | Uptime, DB latency, realtime sessions, accounts by role |
| `POST /api/notifications` | officer / barangay / admin | Broadcast an alert to an audience (`all`, `citizens`, `responders`, `barangay:<name>`, …) |
| `POST /api/incidents/:id/escalate` | barangay / officer | Flag a local incident for municipal command |

Full route list: [docs/api.md](docs/api.md).

## Scripts (backend)

| Script | Does |
|---|---|
| `npm run dev` | API with auto-reload |
| `npm run build` / `npm start` | Compile to `dist/` and run (production) |
| `npm test` | Unit tests (priority engine, incident state machine) |
| `npm run seed` | Upsert the 5 demo login accounts |
| `npm run seed:demo` | Demo accounts + sample operational data (only into empty collections) |

# DRRMO Mobile Apps (Flutter)

Native mobile clients for field and public emergency use.

| App | Folder | Role | Theme |
|-----|--------|------|-------|
| **Citizen** | `citizen_app/` | Residents report emergencies | Emergency crimson |
| **Responder** | `responder_app/` | Field personnel missions | Tactical amber (dark) |

Shared library: `drrmo_core/` (API client, auth, themes, widgets).

## Prerequisites

- [Flutter SDK](https://docs.flutter.dev/get-started/install) 3.18+
- Backend API on `http://localhost:5000`
- Demo users seeded (`seed-users.bat`)

## Setup

```bash
cd mobile/drrmo_core && flutter pub get
cd ../citizen_app && flutter pub get
cd ../responder_app && flutter pub get
```

Or run repo root `setup.ps1` (includes mobile packages).

## Run

**Windows (both apps):**

```bat
run-mobile.bat
```

**Individual:**

```bash
cd mobile/citizen_app
flutter run

cd mobile/responder_app
flutter run
```

**Custom API URL:**

```bash
flutter run --dart-define=DRRMO_API_URL=http://192.168.1.10:5000
```

## Demo logins

| App | Email | Password |
|-----|-------|----------|
| Citizen | `citizen1@email.com` | `DRRMO123` |
| Responder | `responder1@drmmo.gov.ph` | `DRRMO123` |

## Platform notes

- **Android emulator:** API defaults to `http://10.0.2.2:5000`
- **iOS simulator / Windows desktop:** `http://localhost:5000`
- HTTP cleartext is enabled for local development only

## Architecture

Web portals (Admin, Officer, Barangay) remain in `frontend/`. The legacy React folders `frontend/citizen-pwa-app` and `frontend/responder-app` are deprecated in favor of these Flutter apps.

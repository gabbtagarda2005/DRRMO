# Deploying DRRMO (Render + Vercel)

This takes about 30 minutes. You will end up with:

| Piece | Host | Folder | Example URL |
|---|---|---|---|
| Database | MongoDB Atlas (free) | — | `mongodb+srv://…` |
| API + realtime | **Render** (free web service) | `backend/` | `https://drrmo-api.onrender.com` |
| Landing page | **Vercel** | `frontend/landing/` | `https://drrmo.vercel.app` |
| Admin portal | **Vercel** | `frontend/admin-app/` | `https://drrmo-admin.vercel.app` |
| Officer portal | **Vercel** | `frontend/drrmo-officer-app/` | `https://drrmo-officer.vercel.app` |
| Barangay portal | **Vercel** | `frontend/barangay-app/` | `https://drrmo-barangay.vercel.app` |

You'll need free accounts on **GitHub**, **MongoDB Atlas**, **Render** and **Vercel**. Sign in to Render and Vercel *with GitHub* to make importing easiest.

> Do the steps in order. Each later step needs a URL from an earlier one.

---

## Step 1: Push the code to GitHub

The project is already a git repository with an initial commit.

1. On GitHub, click **New repository**. Name it, for example `drrmo`. Set it to **Private**. Don't add a README, .gitignore or license.
2. In a terminal in the project folder (`C:\Websites_Works\DRRMO`):

   ```bash
   git remote add origin https://github.com/<your-username>/drrmo.git
   git push -u origin main
   ```

`.env` files, `node_modules`, build output and logs are git-ignored, so secrets never leave your machine.

---

## Step 2: Create the database (MongoDB Atlas)

Render doesn't host MongoDB, so use Atlas's free tier.

1. Go to <https://www.mongodb.com/cloud/atlas/register> → create a **free M0 cluster**. Pick the region closest to your users (e.g. *Singapore* or *Hong Kong*).
2. **Database Access** → *Add New Database User*. Choose password authentication, create a username and a **strong password**, and give the role *Read and write to any database*.
3. **Network Access** → *Add IP Address* → **Allow access from anywhere** (`0.0.0.0/0`). Render's free tier has no fixed IP, so this is required. Your strong password protects the database.
4. **Database** → *Connect* → *Drivers* → copy the connection string. Replace `<password>` and add the database name `drrmo` before the `?`:

   ```
   mongodb+srv://drrmo_user:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/drrmo?retryWrites=true&w=majority
   ```

Keep this string. It is your `MONGODB_URI`.

---

## Step 3: Deploy the API to Render

1. Render dashboard → **New → Blueprint** → connect your GitHub repo. Render detects `render.yaml` and shows a service called **drrmo-api**.
2. It will ask for the values marked `sync: false`:
   - **`MONGODB_URI`**: the Atlas string from Step 2.
   - **`CORS_ORIGIN`**: for now enter `https://*.vercel.app`. You'll tighten it in Step 5.
3. Click **Apply**. `JWT_SECRET` is generated automatically. The first build takes about 3–5 minutes.
4. When it shows **Live**, open `https://<your-service>.onrender.com/api/health`. You should see:

   ```json
   {"status":"OK","database":"connected", ...}
   ```

Because `SEED_DEMO_DATA=true`, the first boot fills the empty database with the demo accounts and sample incidents, shelters and resources (see "Demo accounts" below). It never touches a database that already has users.

**Copy your API URL**, e.g. `https://drrmo-api.onrender.com`.

> **Free-tier notes**
> - The free instance **sleeps after 15 minutes idle**. The first request after that takes about 30–50 seconds while it wakes. The landing page waits for this. For a live demo, open `/api/health` a minute beforehand, or upgrade to the *Starter* plan for always-on.
> - Uploaded incident photos are stored on the instance disk, which is **wiped on every redeploy**. For permanent media, add a Render Disk (paid) mounted at `/opt/render/project/src/backend/uploads`.

---

## Step 4: Deploy the four frontends to Vercel

Repeat this once per row. Each one is a separate Vercel project from the **same** GitHub repo.

| Project name | Root Directory | Environment variables |
|---|---|---|
| `drrmo-admin` | `frontend/admin-app` | `VITE_API_URL` |
| `drrmo-officer` | `frontend/drrmo-officer-app` | `VITE_API_URL` |
| `drrmo-barangay` | `frontend/barangay-app` | `VITE_API_URL` |
| `drrmo` (landing) | `frontend/landing` | `VITE_API_URL`, `VITE_ADMIN_URL`, `VITE_OFFICER_URL`, `VITE_BARANGAY_URL` (+ optional `VITE_LOCAL_HOTLINE`, `VITE_MUNICIPALITY_NAME`) |

For each one:

1. Vercel dashboard → **Add New… → Project** → import your repo.
2. **Project Name**: as in the table (this sets the URL).
3. **Root Directory** → *Edit* → choose the folder from the table.
4. Framework preset: **Vite** (auto-detected). Leave the build settings as they are; `vercel.json` sets them.
5. **Environment Variables**: set `VITE_API_URL` to your Render URL from Step 3, **without** a trailing slash or `/api`:
   ```
   VITE_API_URL = https://drrmo-api.onrender.com
   ```
6. **Deploy**.

**Deploy the landing page last.** It needs the three portal URLs, for example:

```
VITE_API_URL      = https://drrmo-api.onrender.com
VITE_ADMIN_URL    = https://drrmo-admin.vercel.app
VITE_OFFICER_URL  = https://drrmo-officer.vercel.app
VITE_BARANGAY_URL = https://drrmo-barangay.vercel.app
VITE_MUNICIPALITY_NAME = Municipality of San Isidro      (optional)
VITE_LOCAL_HOTLINE     = (02) 8123-4567                  (optional, shown under Hotlines)
```

> Vite bakes environment variables in **at build time**. If you change one later, go to *Deployments → ⋯ → Redeploy* for it to take effect.

> Keep **"Include files outside the root directory in the Build Step"** enabled. It is on by default under *Settings → General*. The apps share code from `frontend/shared-ui` and `shared/`.

---

## Step 5: Lock down CORS

Back in Render → **drrmo-api → Environment**, set `CORS_ORIGIN` to your real URLs, comma-separated:

```
https://drrmo.vercel.app,https://drrmo-admin.vercel.app,https://drrmo-officer.vercel.app,https://drrmo-barangay.vercel.app,https://drrmo-*.vercel.app
```

The last entry (`drrmo-*`) also allows Vercel preview deployments of your own projects. Save, and Render redeploys automatically.

---

## Step 6: Verify

1. Open the landing page. The **Live** strip should fill with numbers and the top-right pill should say *All systems operational*.
2. Click **Open command center** → sign in as `officer1@drmmo.gov.ph` / `DRRMO123`.
3. Sign in to each portal with its matching demo account.

### Demo accounts (password `DRRMO123`)

| Portal | Email |
|---|---|
| Admin | `admin@drmmo.gov.ph` |
| DRRMO Officer | `officer1@drmmo.gov.ph` |
| Barangay | `barangay1@drmmo.gov.ph` |
| Responder (mobile) | `responder1@drmmo.gov.ph` |
| Citizen (mobile) | `citizen1@email.com` |

> 🔐 **Before real-world use:** sign in as admin and change these passwords under *Users* (or delete the demo accounts). Then set `SEED_DEMO_DATA` to `false` in Render.

---

## Mobile apps (optional)

The Flutter apps read the API URL at build time:

```bash
cd mobile/citizen_app
flutter build apk --dart-define=DRRMO_API_URL=https://drrmo-api.onrender.com
```

Repeat in `mobile/responder_app`. Share the generated APK from `build/app/outputs/flutter-apk/`.

---

## Troubleshooting

| Symptom | Fix |
|---|---|
| Login says *"Cannot reach the DRRMO server"* | `VITE_API_URL` is wrong or missing on Vercel. Fix it, then **Redeploy**. Or the Render service is asleep, so wait 30 s and retry. |
| Browser console shows a **CORS** error | The site's exact URL isn't in `CORS_ORIGIN` on Render. |
| Render deploy fails at boot with *Missing required environment variables* | Set `MONGODB_URI` (and `JWT_SECRET`) in Render → Environment. |
| `/api/health` returns `"database":"disconnected"` | Atlas *Network Access* must allow `0.0.0.0/0`, and check the password in `MONGODB_URI` (URL-encode special characters such as `@` → `%40`). |
| Refreshing a portal page shows 404 | Make sure the project's Root Directory is the app folder, so its `vercel.json` (SPA rewrites) is used. |
| Landing shows *"Live data appears once the platform API is connected"* | `VITE_API_URL` isn't set on the landing project. |

## Seeding a database manually

To seed demo data into any database from your computer:

```bash
cd backend
# PowerShell: $env:MONGODB_URI="mongodb+srv://..."; npm run seed:demo
MONGODB_URI="mongodb+srv://..." npm run seed:demo
```

# SHNOOR CRM

The application has three top-level parts:

- `backend` — Express API, Firebase Admin verification, and Prisma/PostgreSQL access.
- `my-react-app` — CRM landing page, signup, and the existing login form.
- `my-react-app/SuperAdmin-frontend` — protected Super Admin dashboard.

The login form signs in through Firebase, then calls `GET /api/v1/super-admin/organizations`. The backend verifies the Firebase ID token and checks its UID against the `SuperAdmin` table. Authorized Super Admins are redirected to the dashboard. Other registered CRM users continue through the existing `/api/v1/auth/protected` route.

## Local setup

Run each command group in its own PowerShell terminal from `CRM-application`.

### Backend

```powershell
cd backend
npm.cmd ci
```

The backend listens on port `5000` by default and needs a reachable PostgreSQL database configured in `backend/.env`, applied Prisma migrations, and valid Firebase Admin credentials. Set `FIREBASE_WEB_API_KEY` from Firebase Console if Super Admin password changes should be enabled; it is used only by the backend to verify the current password. Check `http://localhost:5000/health` when it starts. If the frontend uses another origin, add it to comma-separated `FRONTEND_ORIGINS` in `backend/.env`.

When updating an existing database whose migration history is already baselined, apply the additive migration before starting the backend:

```powershell
cd backend
npx.cmd prisma migrate deploy
npm.cmd run dev
```

### CRM landing page and login

In a second terminal:

```powershell
cd my-react-app
npm.cmd ci
Copy-Item .env.example .env
```

Fill the `VITE_FIREBASE_*` values in `my-react-app/.env` from Firebase Console → Project settings → Your apps (Web app), then run:

```powershell
npm.cmd run dev -- --port 5173
```

### Super Admin dashboard

In a third terminal:

```powershell
cd my-react-app\SuperAdmin-frontend
npm.cmd ci
npm.cmd run dev
```

Open `http://localhost:5173/login` and sign in with a Firebase account whose verified UID is registered in the backend `SuperAdmin` table. The dashboard runs at `http://localhost:5174/`. During local development, Vite proxies `/api` requests to `http://localhost:5000`, avoiding browser CORS issues. Set `VITE_API_BASE_URL` in the dashboard `.env` for a deployed API outside that proxy; set `VITE_BACKEND_PROXY_TARGET` to change the local proxy target.

Do not put the Firebase Admin service-account private key in either frontend `.env` file. The backend keeps its Admin credentials in `backend/.env` and the service-account file.

## Dashboard/backend coverage

All dashboard API routes require a Firebase ID token belonging to a UID in the `SuperAdmin` table. Organization and user listing, creation, assignment, updates, deletion, audit logs, plan catalog, platform settings, Super Admin profile, password changes, and support tickets/replies are backed by the protected `/api/v1/super-admin` routes. Plan, settings, support-ticket, and Super Admin profile fields are added by the migration above. The dashboard derives overview statistics and analytics from those API responses; CSV export is generated in the browser from the loaded organization users.

The current CRM schema stores organization payment status and subscription amounts, but it has no invoice or payment transaction records, so transaction history cannot be shown. Support's sample queries are seeded into PostgreSQL only when the ticket table is empty. The organization schema stores contact email/phone but not a separate contact name, and CRM user records do not have phone numbers.

Build the dashboard with:

```powershell
cd my-react-app\SuperAdmin-frontend
npm.cmd run build
```

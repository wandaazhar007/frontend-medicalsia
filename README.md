# frontend-medicalsia

Staff dashboard for **Medicalsia** — a clinic management SaaS built for the
Indonesian market. This repo is deployed **once per clinic** (single-tenant):
every subscribing clinic gets its own instance and its own `.env`, pointed at
its own `backend-medicalsia` API. There is no multi-tenant switching logic —
one deployment always serves exactly one clinic.

## Tech Stack

- **Framework**: React + [Vite](https://vitejs.dev)
- **Styling**: SCSS Modules (one `.module.scss` per component)
- **Auth**: Firebase Auth (client SDK) — staff sign in, the ID token is sent
  to `backend-medicalsia` on every request
- **Routing**: React Router
- **Charts**: [Recharts](https://recharts.org)
- **Icons**: lucide-react
- **Barcode**: jsbarcode (patient card Code128 barcode)
- **HTTP**: axios

## Project Structure

```
src/
  pages/
    dashboard/         # Staff-only, behind Firebase auth route guard
    booking/             # Public — patient self-booking, no auth
    display/              # Public — full-screen doctor queue display (waiting room TV)
    display-pharmacy/      # Public — full-screen pharmacy queue display
    Login/
  components/           # Shared UI building blocks (Card, StatCard, charts, ...)
  services/              # axios wrappers per API resource
  context/                # AuthContext (Firebase session + staff role)
  hooks/                   # e.g. useDebounce (live search)
  styles/                   # variables.scss, chart color tokens, reset
```

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Copy `.env.example` to `.env` and fill in this clinic's Firebase project
config and the URL of its `backend-medicalsia` instance:

```bash
cp .env.example .env
```

| Variable | Description |
|---|---|
| `VITE_FIREBASE_API_KEY` / `VITE_FIREBASE_AUTH_DOMAIN` / `VITE_FIREBASE_PROJECT_ID` / `VITE_FIREBASE_STORAGE_BUCKET` / `VITE_FIREBASE_MESSAGING_SENDER_ID` / `VITE_FIREBASE_APP_ID` | Firebase client SDK config for this clinic's Firebase project |
| `VITE_API_BASE_URL` | Base URL of this clinic's `backend-medicalsia` deployment (e.g. `http://localhost:5017` in dev) |

### 3. Run the dev server

```bash
npm run dev
```

### 4. Build for production

```bash
npm run build
npm run preview   # preview the production build locally
```

## Notable Conventions

- **Live search everywhere, no search button.** Every list view debounces
  search input (400ms via `useDebounce`) and resets to page 1 on change.
- **Route guards**: `/pages/dashboard/*` requires an authenticated staff
  session; `/pages/booking`, `/pages/display`, and `/pages/display-pharmacy`
  never require auth and must work as standalone entry points (e.g. linked
  directly from a clinic's own marketing site).
- **Role-aware dashboard**: `/dashboard` renders different widgets per staff
  role (owner/admin/cashier share an operational summary + charts; doctor and
  pharmacy get role-scoped views).
- **Queue announcements**: `/display` and `/display-pharmacy` poll a public
  endpoint and use the browser's Web Speech API (`id-ID` locale) to announce
  new queue calls — first visit on a display device may need a one-time
  "Enable Sound" click due to browser autoplay restrictions.
- **Global connection banner**: a shared `ConnectionStatus` component wraps
  the app and shows a non-blocking "No internet connection" banner with
  auto-retry when API calls fail.

## Deploying a New Clinic

This repo is a **template cloned per clinic**, not a shared multi-tenant app.
Provisioning a new clinic means: a fresh `.env` pointed at that clinic's own
`backend-medicalsia` and Firebase project, then a new build/deploy on its own
subdomain.

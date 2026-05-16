# 🚗 RideBoard

> A scheduled peer-to-peer carpooling web application — connect drivers with empty seats to riders travelling the same route.

**Live Demo:** [ride-board.vercel.app](https://ride-board.vercel.app) &nbsp;

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Deployment](#deployment)

---

## Overview

RideBoard is a community-oriented carpooling platform built around **pre-planned, scheduled rides**. Unlike on-demand ride-hailing services, it lets drivers post a ride for a specific departure time and route, and riders search, discover, and book a seat in advance.

---

## Features

### 🗺️ Map-Based Ride Creation
Drivers create a ride by clicking directly on an interactive map to place their **origin** and **destination** markers. No typing an address into a box — just click, confirm, and go. The map automatically reverse-geocodes the coordinates into human-readable addresses using Nominatim.

### 📍 Live Route Visualisation
Once origin and destination are set, a **live route polyline** is drawn on the map powered by OSRM. Drivers can see the exact path their ride will follow before they post it, and riders can preview the route when browsing available rides.

### 🔍 Smart Ride Discovery
Riders can browse all available rides and filter by **pickup and destination**. The smart search filters the rides to show which have routes that are passing through your pickup and going to your destination. The search is designed to surface rides that are genuinely useful — only active, non-expired rides with available seats are shown.

### 🪑 Instant Seat Booking
Riders can book a seat with a single click. The system uses **atomic database updates** to prevent double-booking — if two riders try to grab the last seat simultaneously, only one succeeds. The ride's status automatically flips to `full` the moment all seats are taken.

### 💬 Per-Ride Group Chat
Once a rider books a seat, they gain access to a **real-time group chat** shared between the driver and all confirmed riders for that trip. Use it to coordinate pickup points, share arrival updates, or just break the ice before the journey. Messages sync live via WebSockets — no refresh needed.

### ⭐ Post-Ride Reviews & Ratings
After a ride expires, participants can leave a **star rating and written review** on the driver's profile. This builds a trust layer within the community — riders can check a driver's track record before booking.

### 📧 Email Booking Confirmations
When a rider books a seat, both the **rider and the driver receive an email confirmation** with trip details — origin, destination, departure time, and fare. This is handled via EmailJS so no backend email server is needed.

### ⏰ Automatic Ride Expiry
Rides expire on their own — a **database-level scheduler** (pg_cron) checks every minute and marks any ride whose departure time has passed as `expired`. Drivers don't need to come back and close their rides manually.

### 🔐 Secure Access Control
Every user can only see and interact with data they're supposed to — **Row Level Security** policies at the database level ensure that, for example, only the participants of a ride can read its group chat messages. Authentication is handled via Supabase JWT tokens.

### 👤 Driver Profile Pages
Each driver has a public profile page showing their **posted rides, average rating, and reviews** left by past riders. Riders can browse this before deciding whether to book.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19 · Vite · TailwindCSS v4 |
| UI Components | shadcn/ui · Radix UI · Framer Motion |
| Map & Routing | Leaflet.js · react-leaflet · OSRM |
| Geocoding | Nominatim (OpenStreetMap) |
| State Management | Zustand |
| Backend | Node.js · Express.js |
| Database & Auth | Supabase (PostgreSQL) |
| Real-time | Supabase Realtime (WebSockets) |
| Scheduling | pg_cron |
| Email | EmailJS |
| Deployment | Vercel (monorepo — frontend + serverless API) |

---

## Architecture

RideBoard follows a **three-tier client-server architecture** deployed as a monorepo on Vercel:

```
┌─────────────────────────────────────────────────┐
│                   Browser                       │
│     React + Leaflet + Supabase Realtime         │
└────────────────────┬────────────────────────────┘
                     │ HTTPS REST / WebSocket
┌────────────────────▼────────────────────────────┐
│            Express.js API (Vercel Serverless)   │
│   /api/auth  /api/rides  /api/bookings          │
│   /api/users  /api/messages  /api/reviews       │
│   /api/search                                   │
└────────────────────┬────────────────────────────┘
                     │ Supabase JS Client
┌────────────────────▼────────────────────────────┐
│              Supabase (PostgreSQL)              │
│       Tables: users · rides · bookings          │
│               messages · reviews                │
│    Auth (JWT) · RLS · Realtime · pg_cron        │
└────────────────────┬────────────────────────────┘
                     │
          ┌──────────┴───────────┐
    ┌─────▼─────┐          ┌─────▼─────┐
    │   OSRM    │          │ Nominatim │
    │  Routing  │          │ Geocoding │
    └───────────┘          └───────────┘
```

On Vercel, all `/api/*` requests are routed to the Express server (`api/index.js`). All other paths serve the built React SPA (`index.html`).

---

## Project Structure

```
DB-Project/
├── api/
│   └── index.js              # Vercel serverless entry point (re-exports Express app)
├── client/                   # React frontend (Vite)
│   ├── src/
│   │   ├── pages/            # Route-level page components
│   │   │   ├── HomePage.jsx
│   │   │   ├── LoginPage.jsx
│   │   │   ├── RegisterPage.jsx
│   │   │   ├── FindRidePage.jsx
│   │   │   ├── PostRidePage.jsx
│   │   │   ├── DriverProfilePage.jsx
│   │   │   └── ProfilePage.jsx
│   │   ├── components/       # Reusable UI components
│   │   ├── api/              # Axios API call wrappers
│   │   ├── store/            # Zustand global state
│   │   ├── lib/              # Supabase client & utility libs
│   │   └── utils/            # Helper functions
│   ├── .env.example
│   └── package.json
├── server/                   # Express backend
│   ├── src/
│   │   ├── index.js          # Express app setup & route mounting
│   │   ├── db.js             # Supabase client initialisation
│   │   ├── routes/           # Route handlers
│   │   │   ├── auth.js
│   │   │   ├── rides.js
│   │   │   ├── search.js
│   │   │   ├── bookings.js
│   │   │   ├── users.js
│   │   │   ├── reviews.js
│   │   │   └── messages.js
│   │   ├── middleware/       # Auth & request middleware
│   │   ├── services/         # Business logic services
│   │   └── utils/            # Server-side helpers
│   ├── .env.example
│   └── package.json
├── supabase/
│   └── migrations/           # Ordered SQL migration files
│       ├── 001_extensions.sql
│       ├── 002_users.sql
│       ├── 003_rides.sql
│       ├── 004_bookings.sql
│       ├── 005_reviews.sql
│       ├── 006_messages.sql
│       ├── 007_cron.sql
│       └── 008_rls.sql
├── vercel.json               # Vercel routing config
└── package.json              # Root scripts
```

---

## Getting Started

### Prerequisites

- **Node.js** v18+
- **npm** v9+
- A [Supabase](https://supabase.com) project with the migrations applied
- (Optional) A local [OSRM](http://project-osrm.org) instance, or use the public demo server

### 1. Clone the repository

```bash
git clone https://github.com/HuzaifaAhmedBari/Ride-Board.git
cd Ride-Board
```

### 2. Apply database migrations

In the Supabase dashboard → **SQL Editor**, run each file in `supabase/migrations/` in order (001 → 008).

### 3. Install dependencies

```bash
npm run install-all
```

This installs dependencies for the root, client, and server packages.

### 4. Configure environment variables

```bash
# Client
cp client/.env.example client/.env

# Server
cp server/.env.example server/.env
```

Fill in the values as described in [Environment Variables](#environment-variables).

### 5. Start the development servers

**Backend** (runs on port 4000):
```bash
cd server
cmd /c npm run dev
```

**Frontend** (runs on port 5173):
```bash
cd client
cmd /c npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## Environment Variables

### `client/.env`

| Variable | Description |
|---|---|
| `VITE_SUPABASE_URL` | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous (public) key |
| `VITE_API_BASE_URL` | Backend API base URL (e.g. `http://localhost:4000/api`) |
| `VITE_EMAILJS_SERVICE_ID` | EmailJS service ID |
| `VITE_EMAILJS_PUBLIC_KEY` | EmailJS public key |
| `VITE_EMAILJS_RIDER_TEMPLATE_ID` | EmailJS template for rider notifications |
| `VITE_EMAILJS_DRIVER_TEMPLATE_ID` | EmailJS template for driver notifications |

### `server/.env`

| Variable | Description |
|---|---|
| `PORT` | Port the Express server listens on (default: `4000`) |
| `SUPABASE_URL` | Your Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (bypasses RLS for server-side operations) |
| `OSRM_BASE_URL` | OSRM routing server URL |
| `EMAILJS_SERVICE_ID` | EmailJS service ID |
| `EMAILJS_PUBLIC_KEY` | EmailJS public key |
| `EMAILJS_PRIVATE_KEY` | EmailJS private key |
| `EMAILJS_RIDER_TEMPLATE_ID` | EmailJS template for rider notifications |
| `EMAILJS_DRIVER_TEMPLATE_ID` | EmailJS template for driver notifications |
| `CLIENT_ORIGIN` | Allowed CORS origin (e.g. `http://localhost:5173`) |
| `NODE_ENV` | `development` or `production` |

---

## Deployment

The project is configured for **Vercel monorepo deployment**:

1. **Build command:** `npm run build` (runs `cd client && npm install && npm run build`)
2. **Output directory:** `client/dist`
3. **Serverless functions:** `api/index.js` handles all `/api/*` routes
4. **Routing:** `vercel.json` rewrites `/api/*` to the serverless function and all other paths to `index.html` (SPA fallback)

Set all environment variables (both client `VITE_*` and server variables) in the Vercel project settings before deploying. Set `VITE_API_BASE_URL` to `/api` for production.

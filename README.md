# Hospital Management System

A full-stack **Hospital Management System** for managing patients, doctors, and
appointments. Built as a monorepo with an Express + SQLite REST API and a
React + Vite single-page front end.

![Dashboard](https://img.shields.io/badge/stack-React%20%7C%20Express%20%7C%20SQLite-2563eb)

## Features

- **Dashboard** — live counts of patients, doctors, and appointments plus an upcoming-appointments feed.
- **Patients** — register and remove patients (name, age, gender, contact, address).
- **Doctors** — manage medical staff and specialties.
- **Appointments** — schedule visits between a patient and a doctor, and update status (Scheduled / Completed / Cancelled).
- **Seeded demo data** — the database is auto-created and seeded on first start.

## Tech stack

| Layer    | Technology                                             |
| -------- | ------------------------------------------------------ |
| Frontend | React 19, React Router, Vite, TypeScript               |
| Backend  | Node.js, Express 5, TypeScript, `better-sqlite3`       |
| Database | SQLite (file-based, no external service required)      |
| Tooling  | npm workspaces, `tsx`                                  |

## Project structure

```
.
├── client/          # React + Vite front end (port 5173)
│   └── src/
│       ├── pages/       # Dashboard, Patients, Doctors, Appointments
│       └── components/  # Modal
├── server/          # Express REST API (port 4000)
│   └── src/
│       ├── index.ts     # routes
│       ├── db.ts        # SQLite schema + seed
│       └── seed.ts      # standalone seeder
├── scripts/
│   └── smoke-test.mjs   # end-to-end API smoke test
└── package.json     # npm workspaces root
```

## Getting started

Requires Node.js 20.19+ (or 22.12+) and npm.

```bash
# 1. Install all workspace dependencies
npm install

# 2a. Start the API server (http://localhost:4000)
npm run dev:server

# 2b. In a second terminal, start the web client (http://localhost:5173)
npm run dev:client
```

Open http://localhost:5173 in your browser. The Vite dev server proxies
`/api/*` requests to the backend on port 4000.

### Single-port production run

For a production-style run served entirely from **one port** (no proxy, no
second server), build the app and start the API server — it also serves the
built front end and handles client-side routes:

```bash
npm run serve   # builds client + server, then serves everything on port 4000
```

Then open http://localhost:4000. Under the hood this runs `npm run build`
followed by `npm start` (which is `node server/dist/index.js`). The server
serves `client/dist` as static files with an SPA fallback, so deep links like
`/patients` work on reload.

## Useful scripts

| Command                | Description                                              |
| ---------------------- | -------------------------------------------------------- |
| `npm run dev:server`   | Start the API with hot reload (`tsx watch`).             |
| `npm run dev:client`   | Start the Vite dev server for the front end.             |
| `npm run build`        | Type-check/build the server (`tsc`) and client (`vite`). |
| `npm start`            | Serve the built app (API + UI) on a single port (4000).  |
| `npm run serve`        | `build` then `start` — one command single-port run.      |
| `npm run seed`         | Reset and re-seed the SQLite database with demo data.    |
| `npm run test:api`     | Run the end-to-end API smoke test (server must be up).   |

## API reference

Base URL: `http://localhost:4000`

| Method   | Path                    | Description                          |
| -------- | ----------------------- | ------------------------------------ |
| `GET`    | `/api/health`           | Health check.                        |
| `GET`    | `/api/stats`            | Dashboard counts + upcoming visits.  |
| `GET`    | `/api/patients`         | List patients.                       |
| `POST`   | `/api/patients`         | Create a patient.                    |
| `PUT`    | `/api/patients/:id`     | Update a patient.                    |
| `DELETE` | `/api/patients/:id`     | Delete a patient.                    |
| `GET`    | `/api/doctors`          | List doctors.                        |
| `POST`   | `/api/doctors`          | Create a doctor.                     |
| `PUT`    | `/api/doctors/:id`      | Update a doctor.                     |
| `DELETE` | `/api/doctors/:id`      | Delete a doctor.                     |
| `GET`    | `/api/appointments`     | List appointments (with names).      |
| `POST`   | `/api/appointments`     | Schedule an appointment.             |
| `PUT`    | `/api/appointments/:id` | Update an appointment (e.g. status). |
| `DELETE` | `/api/appointments/:id` | Delete an appointment.               |

## Configuration

| Variable          | Default              | Used by | Description                          |
| ----------------- | -------------------- | ------- | ------------------------------------ |
| `PORT`            | `4000`               | server  | API listen port.                     |
| `DB_PATH`         | `server/data/hospital.db` | server  | SQLite database file path.      |
| `VITE_API_TARGET` | `http://localhost:4000` | client  | Proxy target for `/api` requests. |

## Cloud Agent environment

`.cursor/environment.json` configures the Cursor Cloud Agent environment:
`npm ci` installs dependencies, and two terminals run the API server and web
client automatically.

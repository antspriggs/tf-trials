# TF Trials

Track and field tryout management for coaches. Register athletes, schedule events, record performances with a live timer, track qualification status, and export results as CSV with QR codes.

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript, React 19
- **Database:** PostgreSQL (auto-migrating schema)
- **Styling:** Tailwind CSS 4
- **QR Codes:** qrcode.react

## Features

- **Athlete Registration** -- add athletes with student ID, name, grade, gender
- **Bib Management** -- generate bib number pools (range or list), auto-assign to athletes
- **Event Configuration** -- default track & field events (100m through Pole Vault), custom events, gender-specific qualification thresholds
- **Performance Recording** -- smart parsing for time (`mm:ss.xx`, `ss.xx`) and distance/height (`18-6`, `5'10"`, `1.5m`)
- **Qualification Engine** -- automatic/provisional/DNQ status with real-time recalculation when standards change
- **Results Dashboard** -- aggregated results by event with athlete details
- **CSV Export** -- full tryout data export with qualification summaries
- **Coach's Discretion** -- flag athletes for manual qualification override

## Setup

```bash
git clone <repo-url>
cd tf-trials
npm install
```

Create a `.env.local` file:

```env
POSTGRES_URL=postgres://user:password@localhost:5432/tf_trials
```

The database schema is auto-created on first API request -- no manual migrations needed.

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## API Routes

| Method   | Path                          | Description                                |
| -------- | ----------------------------- | ------------------------------------------ |
| `GET`    | `/api/athletes`               | List all athletes (optional `?q=` search)  |
| `POST`   | `/api/athletes`               | Register a new athlete                     |
| `GET`    | `/api/athletes/:id`           | Get athlete by ID                          |
| `PUT`    | `/api/athletes/:id`           | Update athlete fields                      |
| `DELETE` | `/api/athletes/:id`           | Delete athlete                             |
| `GET`    | `/api/events`                 | List all events (seeds defaults on first call) |
| `POST`   | `/api/events`                 | Create a custom event                      |
| `GET`    | `/api/events/:id`             | Get event by ID                            |
| `PUT`    | `/api/events/:id`             | Update event (recalculates qualifications) |
| `DELETE` | `/api/events/:id`             | Delete event                               |
| `GET`    | `/api/performances`           | List all performances                      |
| `POST`   | `/api/performances`           | Record a performance                       |
| `PUT`    | `/api/performances/:id`       | Update a performance value                 |
| `DELETE` | `/api/performances/:id`       | Delete a performance                       |
| `GET`    | `/api/bibs`                   | List all bibs (or `?stats=1` for summary)  |
| `POST`   | `/api/bibs`                   | Add bibs by range or list                  |
| `DELETE` | `/api/bibs/:bib_number`       | Remove an unassigned bib                   |
| `GET`    | `/api/results`                | Aggregated results with events             |
| `GET`    | `/api/export`                 | Download tryout data as CSV                |

## Scripts

| Command         | Description              |
| --------------- | ------------------------ |
| `npm run dev`   | Start dev server         |
| `npm run build` | Production build         |
| `npm start`     | Start production server  |
| `npm run lint`  | Run ESLint               |
| `npm test`      | Run tests (vitest)       |

## Deployment

Designed for Vercel. Set `POSTGRES_URL` in environment variables. The app auto-detects Vercel and limits the connection pool to 1. SSL is enabled for non-localhost connections.

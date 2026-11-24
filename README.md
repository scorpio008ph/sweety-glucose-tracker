# Sweety — Blood Glucose Tracker

A responsive full-stack app for recording up to four blood glucose readings per day and viewing daily, month-to-date, and previous-month reports.

**Stack:** React (Vite), Node.js, Express, PostgreSQL, JWT, bcrypt. Database is PostgreSQL (not MongoDB) as specified in the assignment.

## Requirements
- Node.js 20+ and npm
- PostgreSQL 14+

## Installation and database setup

1. Create a PostgreSQL database named `sweety` (using `psql` or pgAdmin):

   ```sql
   CREATE DATABASE sweety;
   ```

2. Start the backend:

   ```bash
   cd server
   npm install
   cp .env.example .env
   ```

   Edit `server/.env`: set your own PostgreSQL credentials in `DATABASE_URL`, and generate a strong random `JWT_SECRET` (32+ characters). On Windows, use `copy .env.example .env` instead of `cp`.

   ```bash
   npm run db:init
   npm run seed
   npm run dev
   ```

3. In a **second terminal**, start the frontend:

   ```bash
   cd client
   npm install
   cp .env.example .env
   npm run dev
   ```

4. Open http://localhost:5173. API health: http://localhost:4000/api/health.

### Demo login

- Email: `demo@sweety.local`
- Password: `Demo12345!`

Demo credentials are for local development only. Do not deploy this account publicly.

## Environment variables

`server/.env.example`: `PORT`, `DATABASE_URL`, `JWT_SECRET`, `CLIENT_ORIGIN`, `NODE_ENV`.

`client/.env.example`: `VITE_API_URL`.

Never commit real `.env` files. `JWT_SECRET` must be 32+ characters.

## Scripts

From `server/`:
- `npm run db:init` — create tables and indexes (idempotent)
- `npm run seed` — insert demo user and today's four readings (idempotent)
- `npm run dev` — start API with file watching
- `npm start` — start API
- `npm test` — run validation and report-date unit tests

From `client/`:
- `npm run dev` — start Vite
- `npm run build` — build frontend
- `npm run preview` — preview production build

## API endpoints

| Method | Endpoint | Purpose |
| --- | --- | --- |
| POST | `/api/auth/register` | Create user (`name`, `email`, `password`) |
| POST | `/api/auth/login` | Login (`email`, `password`) |
| GET | `/api/readings?page=1&limit=20` | List only current user's readings (optional `date`) |
| POST | `/api/readings` | Add `{date,slot,value}` |
| PUT | `/api/readings/:id` | Update owned reading |
| DELETE | `/api/readings/:id` | Delete owned reading |
| GET | `/api/reports/daily?date=2026-10-15` | Daily stats and slot list |
| GET | `/api/reports/mtd?date=2026-10-15` | 1st through selected day |
| GET | `/api/reports/monthly?date=2026-10-15` | Full previous month |

Protected endpoints require `Authorization: Bearer <token>`. Slot values: `Morning (fasting)`, `After breakfast`, `After lunch`, `After dinner`.

## Validation and privacy

- Integer value 40–600 mg/dl; date not in future; exactly one reading per user/date/slot.
- PostgreSQL `UNIQUE` and `CHECK` constraints enforce consistency. Transaction and per-user row lock serialize writes to prevent concurrent daily-limit bypasses.
- All reading queries filter by authenticated `user_id`; other users' IDs return 404 for updates/deletes.
- Passwords are salted and hashed using bcrypt (12 rounds); JWTs expire after 7 days.
- Date-only fields are treated as calendar dates, not timestamps. Daily and monthly ranges are inclusive.

## Tests

Run `cd server && npm test`. Unit tests cover required value/date/slot validation and report date ranges, including year boundaries. For a fuller production release, add API integration tests with a dedicated test PostgreSQL database and React Testing Library tests.

## Submission checklist

- [ ] Run app and verify signup, login, add/edit/delete, validation, reports, and user isolation
- [ ] Run tests and frontend build
- [ ] Make several meaningful Git commits (see below)
- [ ] Push public GitHub repository (do not commit `.env`)
- [ ] Add screenshots or a 2–3 minute demo video to the repo
- [ ] Reply to Kenpath with GitHub URL and screenshots/video by **24 November 2026**

Suggested commits: `chore: initialize project`, `feat: auth and database`, `feat: readings CRUD`, `feat: reports`, `feat: React UI`, `test: validation and docs`.

## Notes — assumptions and future improvements

- The date selected in the reports UI is used for daily and MTD reports; "Monthly" means the **previous full calendar month** relative to the selected date.
- No clinical interpretation or medical advice is displayed; this is a logging tool, not a medical device.
- Dates are validated using the server's local calendar date. For users in different time zones, production would define the user's time zone explicitly.
- One reading per slot means a maximum of four; duplicates are rejected even if another slot is unused.
- This is a fresher-level assignment. Improvements: refresh tokens or secure HTTP-only cookies, password reset, rate-limit tuning, accessibility checks, integration/frontend tests, Docker Compose, and a chart.
- For public production use, remove demo credentials, use HTTPS, secure secrets management, and add a proper migration system.

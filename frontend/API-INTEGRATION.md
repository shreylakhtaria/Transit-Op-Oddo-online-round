# TransitOps — API integration notes

The frontend talks to the team's Express/Sequelize backend. This file records how to
run it, what's wired, and what the API can't do yet.

## Running the stack

**Backend** (not in this repo — it's the team repo):

```bash
git clone -b kathan https://github.com/shreylakhtaria/Transit-Op-Oddo-online-round.git
cd Transit-Op-Oddo-online-round/backend
```

Use the **`kathan`** branch. `main` does not start — `src/modules/analytics/controller.js`
is missing a closing brace, and because `index.js` imports it transitively, *every*
endpoint 500s, not just analytics.

Requires MySQL (`brew install mysql && brew services start mysql`). Create `backend/.env`:

```
PORT=8000
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=transit_ops_db
DB_USER=root
DB_PASS=
JWT_SECRET=local_dev_only_secret_not_for_production
```

```bash
npm install
npx sequelize-cli db:create && npx sequelize-cli db:migrate && npx sequelize-cli db:seed:all
node src/index.js          # → http://localhost:8000/api
```

**Frontend:** `npm run dev`. Base URL is `NEXT_PUBLIC_API_URL` in `.env.local`.

## Signing in

Seeded users, all with password `password123`:
`manager@` · `driver@` · `safety@` · `finance@transitops.com`

Login is **two-step**: credentials → OTP → JWT. No SMTP is configured, so **the 6-digit
code is printed to the backend console** — keep that terminal visible when signing in.

## Shape of the API (verified against the running server, not the docs)

- Routes are mounted **flat**: `/api/vehicles`, not `/api/fleet/vehicles`.
- **List endpoints return a bare top-level array by default** — no `{data: ...}` envelope.
  Pagination is **opt-in** (added in PR #1): pass `?page=` or `?limit=` and you get
  `{ data, total, page, limit }` instead. With no params the shape is unchanged, so the
  frontend stays on the bare-array path and its table footers show real counts.
- Access tokens expire in 15 minutes; `lib/api/client.ts` transparently spends the
  refresh token and replays the request once on a 401. Refresh tokens are not rotated.

### Field names and enums come from the models, NOT the Figma copy

The design and the database disagree, and the database wins. These bit us once already:

| Thing | Design says | API actually uses |
| --- | --- | --- |
| Vehicle status | "In Maintenance" | **`In Shop`** |
| Trip status | "In Progress" | *(no such value)* — `Draft`/`Dispatched`/`Completed`/`Cancelled` |
| Maintenance status | "Open" / "In Shop" | **`Active`** / `Closed` |
| Maintenance work | `serviceType` | **`description`**, plus a required **`startDate`** (YYYY-MM-DD) |
| Expense | `type` | **`description`**, `amount`, `category` (`Fuel`/`Maintenance`/`Toll`/`Other`), `date` |

`POST /maintenance` rejects any body missing `description` or `startDate`.

## Wired to live data

Every screen. Login (two-step) · Dashboard · Vehicle Registry · Drivers · Trips ·
Maintenance (the Log Service Record form really POSTs) · Fuel & Expenses (incl. the Fuel
Logs table) · Analytics · Settings (depot config read/write, plus real roles, real user
counts, and working role reassignment).

## Still on mock data — carries a `<MockBadge>` in the UI

Three panels, and only because the API genuinely has **no endpoint** for them. The badge
exists so mock rows are never mistaken for real ones.

| UI | Missing endpoint |
| --- | --- |
| Dashboard → Fleet Health Index | no health endpoint |
| Dashboard → Critical Alerts | no alerts endpoint |
| Settings → Security & Auth | no security-settings endpoints (2FA, session timeout, password policy) |

## Deliberately deleted, not wired

Some of the mockup describes things the system cannot know. Rendering them next to real
numbers would be fiction, so they are gone rather than faked:

- **RBAC permission columns** ("Data Visibility" / "Ops Control" / "Financials"). The
  `Roles` table holds only `id` and `name`; permissions are enforced in backend route
  guards, not stored as data. Nothing could ever populate those columns. The panel now
  shows real roles, real user counts, and role reassignment instead.
- **"Define New Role"** — there is no role-creation endpoint, and `PATCH /users/:id/role`
  rejects any name outside the four seeded roles.
- **The login "Role (RBAC)" picker.** `POST /auth/login` takes only email + password —
  your role comes from your account. A picker implied you could choose your own privileges.
  It also offered **"Dispatcher"**, which is not a real role; the fourth role is **Driver**.

## Dropped from the design (no data to back it)

Trip ETA · driver "Trip %" · "Avg Price Per Liter" · "Avg Turnaround" · every
trend/delta caption (`+4.2%`, `+1.2% vs last month`, …) · the Jun–Aug projection bars
on the revenue chart. These were invented figures in the mockup; showing them against a
live API would have been lying to the user.

## Backend gaps — closed in PR #1

These were the blockers. All four are implemented on branch `pratham-backend-gaps` and
open as [PR #1](https://github.com/shreylakhtaria/Transit-Op-Oddo-online-round/pull/1):

1. **`POST /auth/register` was a privilege-escalation hole** — no `requireAuth`, and it
   accepted a client-supplied `roleName` including `Fleet Manager`. An anonymous caller
   got a `201 Created` admin account. It now requires an authenticated Fleet Manager.
   (Plus a guard refusing to demote the *last* Fleet Manager, which would otherwise lock
   everyone out of user management permanently.)
2. **`GET /expenses/fuel`** — fuel logs were write-only, so the Fuel Logs table was
   impossible to populate.
3. **Users & roles API** — `GET /roles`, `GET /users`, `PATCH /users/:id/role`.
4. **Opt-in pagination** on the list endpoints, backwards compatible.

Merge that PR before running this frontend against `main`, or the Fuel Logs and RBAC
panels will 404.

### Still open for the backend team

- No endpoints for fleet health, critical alerts, or the security settings (2FA, session
  timeout, password policy) — those three panels stay on mock data.
- Their test suite could not run on a fresh clone (`env.js` exits when `JWT_SECRET` is
  missing and `.env` is gitignored). PR #1 fixes that too.

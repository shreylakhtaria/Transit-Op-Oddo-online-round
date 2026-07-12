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
- **No pagination and no `{data: ...}` envelope.** Every list endpoint returns a bare
  top-level array. The table footers show real counts rather than fake page numbers.
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

Dashboard · Vehicle Registry · Drivers · Trips · Maintenance (incl. the Log Service
Record form, which really POSTs) · Analytics · Settings → General Depot Settings
(reads and writes `DEPOT_NAME` / `CURRENCY` / `DISTANCE_UNIT`).

## Still on mock data — carries a `<MockBadge>` in the UI

These have **no backing endpoint**. The badge exists so mock rows are never mistaken
for real ones.

| UI | Missing endpoint |
| --- | --- |
| Fuel Logs table | `GET /fuel-logs` — the API can `POST /expenses/fuel` but offers no way to read them back |
| Settings → RBAC table | `GET /users`, `GET /roles`, role assignment |
| Settings → Security & Auth | no security-settings endpoints |
| Dashboard → Fleet Health Index | no health endpoint |
| Dashboard → Critical Alerts | no alerts endpoint |

## Dropped from the design (no data to back it)

Trip ETA · driver "Trip %" · "Avg Price Per Liter" · "Avg Turnaround" · every
trend/delta caption (`+4.2%`, `+1.2% vs last month`, …) · the Jun–Aug projection bars
on the revenue chart. These were invented figures in the mockup; showing them against a
live API would have been lying to the user.

## Ask the backend team for

1. `GET /fuel-logs` (or make `GET /expenses` include fuel rows with litres + price).
2. User/role endpoints, so RBAC stops being decorative. Note `POST /auth/register` is
   currently **unauthenticated and lets anyone self-assign the Fleet Manager role**.
3. Pagination (`?page=`/`?limit=`) on list endpoints before the fleet grows.

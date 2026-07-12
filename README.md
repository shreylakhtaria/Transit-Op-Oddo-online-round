# TransitOps — Smart Transport Operations Platform

A full-stack backend API for managing fleet operations, trip dispatching, maintenance tracking, finance logging, and analytics for transport companies.

## Tech Stack

- **Runtime:** Node.js (ES Modules)
- **Framework:** Express.js 4.x
- **Database:** MySQL 8.x via Sequelize 6.x ORM
- **Auth:** JWT (Access + Refresh tokens) + OTP via Email
- **Validation:** Zod 3.x
- **Testing:** Jest with SQLite (in-memory)

## Project Structure

```
backend/
├── src/
│   ├── config/
│   │   ├── database.js          # Sequelize instance & connection
│   │   ├── env.js               # Environment variable validation (Zod)
│   │   └── mailer.js            # Nodemailer config (SMTP or console fallback)
│   ├── database/
│   │   ├── config.cjs           # Sequelize CLI config
│   │   ├── migrations/          # 13 migration files
│   │   └── seeders/             # Initial seed data
│   ├── middlewares/
│   │   ├── authMiddleware.js    # JWT Bearer token verification
│   │   └── roleMiddleware.js    # RBAC role checking
│   ├── models/                  # 12 Sequelize models
│   ├── modules/
│   │   ├── auth/                # Register, Login, OTP, Refresh, Logout
│   │   ├── fleet/               # Vehicles & Drivers CRUD, Documents
│   │   ├── trips/               # Trip lifecycle (Draft→Dispatched→Completed/Cancelled)
│   │   ├── maintenance/         # Maintenance logs (Start/Close)
│   │   ├── finance/             # Fuel logs, Expenses, Operational cost
│   │   ├── analytics/           # Dashboard KPIs, Revenue, CSV export
│   │   └── settings/            # Key-value settings
│   ├── routes/index.js          # Central router
│   ├── scripts/                 # Manual verification scripts
│   └── index.js                 # App entry point
├── __tests__/                   # 125 automated tests
├── __mocks__/                   # Test mocks (SQLite DB, Mailer)
├── jest.config.js
├── package.json
└── .env
```

## Setup

### Prerequisites

- Node.js v18+
- MySQL 8.x running on `127.0.0.1:3306`

### Installation

```bash
cd backend
npm install
```

### Environment Variables

Create `.env` in `backend/`:

```env
JWT_SECRET=supersecretjwtkey12345
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=transit_ops_db
DB_USER=root
DB_PASS=12345678
```

### Database Setup

```bash
npm run db:create
npm run db:migrate
npm run db:seed
```

### Start Server

```bash
npm run dev
```

Server runs at `http://localhost:8000`

## Pre-seeded Accounts

| Email | Password | Role |
|---|---|---|
| `manager@transitops.com` | `password123` | Fleet Manager |
| `driver@transitops.com` | `password123` | Driver |
| `safety@transitops.com` | `password123` | Safety Officer |
| `finance@transitops.com` | `password123` | Financial Analyst |

## API Endpoints

### Authentication (`/api/auth`)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/register` | No | Register a new user |
| POST | `/login` | No | Login → sends OTP, returns temp token |
| POST | `/verify-otp` | No | Verify OTP → returns access + refresh tokens |
| POST | `/refresh` | No | Refresh access token |
| POST | `/logout` | No | Revoke refresh token |
| GET | `/me` | Yes | Get current user profile |

### Fleet — Vehicles (`/api/vehicles`)

| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| GET | `/` | Yes | Any | List vehicles (filters: `type`, `status`) |
| GET | `/:id` | Yes | Any | Get vehicle by ID |
| POST | `/` | Yes | Fleet Manager | Create vehicle |
| PUT | `/:id` | Yes | Fleet Manager | Update vehicle |
| DELETE | `/:id` | Yes | Fleet Manager | Delete vehicle |
| GET | `/:id/documents` | Yes | Any | List vehicle documents |
| POST | `/:id/documents` | Yes | Fleet Manager | Add document |
| DELETE | `/:id/documents/:docId` | Yes | Fleet Manager | Delete document |

### Fleet — Drivers (`/api/drivers`)

| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| GET | `/` | Yes | Any | List drivers (filter: `status`) |
| GET | `/:id` | Yes | Any | Get driver by ID |
| POST | `/` | Yes | FM / SO | Create driver |
| PUT | `/:id` | Yes | FM / SO | Update driver |
| DELETE | `/:id` | Yes | FM / SO | Delete driver |
| POST | `/remind-expiry` | Yes | FM / SO | Send license expiry reminders |

### Trips (`/api/trips`)

| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| GET | `/` | Yes | Any | List trips (filter: `status`) |
| GET | `/dispatchable-assets` | Yes | Any | Available vehicles & drivers |
| GET | `/:id` | Yes | Any | Get trip by ID |
| POST | `/` | Yes | Driver / FM | Create trip (status: Draft) |
| POST | `/:id/dispatch` | Yes | Driver / FM | Dispatch trip |
| POST | `/:id/complete` | Yes | Driver / FM | Complete trip |
| POST | `/:id/cancel` | Yes | Driver / FM | Cancel trip |

### Maintenance (`/api/maintenance`)

| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| GET | `/` | Yes | Any | List logs (filter: `status`) |
| POST | `/` | Yes | Fleet Manager | Start maintenance |
| POST | `/:id/close` | Yes | Fleet Manager | Close maintenance |

### Finance (`/api/expenses`)

| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| GET | `/` | Yes | Any | List expenses (filters: `vehicleId`, `category`) |
| GET | `/vehicle/:vehicleId` | Yes | Any | Vehicle operational cost breakdown |
| POST | `/fuel` | Yes | FM / FA | Log fuel (auto-creates expense) |
| POST | `/other` | Yes | FM / FA | Log other expense |

### Analytics (`/api/analytics`)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/dashboard` | Yes | KPIs, chart data, recent trips |
| GET | `/monthly-revenue` | Yes | Revenue aggregated by month |
| GET | `/top-costliest` | Yes | Vehicles sorted by operational cost |
| GET | `/export/csv` | Yes | Download fleet analytics CSV |

### Settings (`/api/settings`)

| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| GET | `/` | Yes | Any | Get all settings |
| PUT | `/` | Yes | Fleet Manager | Upsert settings |

## Business Rules

### Trip Lifecycle

```
Draft → Dispatched → Completed
Draft → Cancelled
Dispatched → Cancelled
```

- Dispatching changes vehicle + driver status to `On Trip`
- Completing/cancelling restores both to `Available`
- Completing auto-creates FuelLog + Expense entries
- Cannot cancel a Completed or already Cancelled trip

### Vehicle Status

```
Available → On Trip     (trip dispatched)
On Trip → Available     (trip completed/cancelled)
Available → In Shop     (maintenance started)
In Shop → Available     (maintenance closed)
```

- Retired and In Shop vehicles cannot be assigned to trips
- Maintenance creates an auto Expense entry

### Driver Rules

- Suspended drivers cannot be assigned to trips
- Drivers with expired licenses are blocked from dispatch
- Off Duty drivers cannot be assigned to trips
- Account locks after 5 failed login attempts (15 min)

### RBAC Roles

| Role | Permissions |
|---|---|
| Fleet Manager | Full access (CRUD vehicles, drivers, trips, maintenance, finance, settings) |
| Driver | Create/Dispatch/Complete/Cancel trips |
| Safety Officer | Create/Update drivers, license expiry reminders |
| Financial Analyst | Log fuel, Log expenses |

## Database Schema

### ER Diagram (Key Relationships)

```
Roles 1──N Users 1──N RefreshTokens
                1──N Otps
                1──1 Drivers

Vehicles 1──N Trips
         1──N MaintenanceLogs
         1──N FuelLogs
         1──N Expenses
         1──N VehicleDocuments

Drivers 1──N Trips
Trips   1──N FuelLogs
Trips   1──N Expenses
```

### Tables

| Table | Key Fields |
|---|---|
| Roles | id, name |
| Users | id (UUID), name, email, password (hashed), roleId, failedAttempts, lockUntil |
| RefreshTokens | id, userId, token, expiresAt, isRevoked |
| Vehicles | id, registrationNumber (unique), model, type, maxLoadCapacity, odometer, acquisitionCost, status |
| Drivers | id, name, licenseNumber (unique), licenseCategory, licenseExpiryDate, contactNumber, safetyScore, status, userId |
| Trips | id, source, destination, vehicleId, driverId, cargoWeight, plannedDistance, actualDistance, fuelConsumed, revenue, status, dispatchDate, completionDate |
| MaintenanceLogs | id, vehicleId, description, cost, startDate, endDate, status |
| FuelLogs | id, vehicleId, tripId, liters, cost, date |
| Expenses | id, vehicleId, tripId, description, amount, category, date |
| Otps | id, userId, code, expiresAt, isUsed |
| Settings | id, key (unique), value |
| VehicleDocuments | id, vehicleId, documentType, documentNumber, expiryDate, documentUrl |

## Testing

### Run All Tests

```bash
npm test
```

Tests use an **in-memory SQLite** database (no MySQL required). The suite covers:

| Suite | Tests | Covers |
|---|---|---|
| auth.test.js | 13 | Register, Login, OTP, Refresh, Logout, Account Locking |
| fleet.test.js | 22 | Vehicle/Driver CRUD, Documents, Filters, Duplicate Detection |
| trips.test.js | 22 | Create, Dispatch, Complete, Cancel, All Business Rules |
| maintenance.test.js | 10 | Start, Close, Status Filters, Edge Cases |
| finance.test.js | 14 | Fuel Logging, Expenses, Operational Cost Aggregation |
| analytics.test.js | 8 | Dashboard KPIs, Revenue, Top Costliest, CSV Export |
| settings.test.js | 4 | Get, Upsert Settings |
| middleware.test.js | 10 | JWT Auth, RBAC Role Checks |
| validators.test.js | 22 | All Zod Schemas (valid + invalid inputs) |
| **Total** | **125** | |

### Test Verbose Output

```bash
npm run test:verbose
```

## Scripts

| Script | Description |
|---|---|
| `npm start` | Start production server |
| `npm run dev` | Start dev server with nodemon |
| `npm run db:create` | Create MySQL database |
| `npm run db:migrate` | Run all migrations |
| `npm run db:seed` | Seed initial data |
| `npm run db:seed:undo` | Undo all seeders |
| `npm run db:migrate:undo` | Undo all migrations |
| `npm test` | Run test suite |
| `npm run test:verbose` | Run tests with verbose output |

# TransitOps — Smart Transport Operations Platform

TransitOps is a comprehensive, full-stack platform built for managing fleet operations, trip dispatching, maintenance tracking, financial logging, and data analytics.

This project was built as a Odoo Online Hackathon submission.

🚀 **[Live Website](https://transitops-six.vercel.app/)** | 🎥 **[Demo Video](https://drive.google.com/drive/folders/1we5l0YIUG3RSGEOIAz8n8VD4O7F3K9Qa?usp=sharing)**

---

## 👥 Meet the Team

We are a group of passionate developers:
- **Kathan Modh**
- **Om Rahisya**
- **Pratham Patel**
- **Shrey Lakhataria**

---

## 🏗️ Architecture & Tech Stack

The platform is split into two distinct, decoupled environments: a robust Next.js frontend and a highly secure Node.js/Express backend.

### Frontend
- **Framework:** Next.js 14 (App Router)
- **Styling:** Tailwind CSS (Dark Mode & Glassmorphism)
- **State/Fetching:** TanStack React Query (v5)
- **Components:** Recharts, Lucide React
- **Language:** TypeScript

### Backend
- **Framework:** Node.js (v18+) with Express.js
- **Database:** MySQL 8.x via Sequelize ORM
- **Auth:** JWT (Access + Refresh tokens) + OTP via Nodemailer SMTP
- **Validation:** Zod schemas
- **Testing:** Jest with SQLite (125+ automated tests)

---

## 🚀 Core Features

### 1. Unified Mission Control
A premium, dark-mode inspired dashboard offering real-time KPIs (Active Vehicles, Vehicles in Maintenance, Active Trips). Fully dynamic filtering updates all charts and recent trip tables via URL query parameters.

### 2. Two-Step Authentication & RBAC
- **OTP Verification:** Secure login flows generate short-lived JWT tokens and email 6-digit OTP codes via SMTP.
- **Role-Based Access Control:** Strict enforcement across four distinct roles: Fleet Manager, Driver, Safety Officer, and Financial Analyst.

### 3. Trip Lifecycle & Dispatch Engine
- Strict dispatching validations: Prevents assigning retired/in-shop vehicles, suspended drivers, or overloading cargo weights.
- Full trip lifecycle execution (`Draft ➔ Dispatched ➔ Completed ➔ Cancelled`).
- Automatic background updates: Completing a trip automatically logs fuel consumed, generates an expense record, and updates the vehicle's odometer.

### 4. Fleet & Maintenance Management
- **Vehicle Registry:** Complete CRUD capabilities with attached **Document Management** for tracking insurance and permits.
- **Maintenance Workshop:** Start/Close jobs directly transitioning vehicles in and out of the shop.

### 5. Financial & Analytics Views
- **Return on Investment (ROI):** Computes financial return ratios per vehicle dynamically.
- **Costliest Vehicles:** Ranked visual breakdowns of the most expensive assets.
- **Reporting Export:** Direct single-click CSV and PDF exports for all fleet statistics, operating costs, and ROI metrics.

---

## ⚙️ Installation & Setup

### Prerequisites
- Node.js (v18+)
- MySQL Server (running on localhost:3306)

### 1. Backend Setup

Open a terminal and navigate to the `backend` directory:
```bash
cd backend
npm install
```

Create a `.env` file in the `backend/` directory:
```env
PORT=8000
NODE_ENV=development

# Database configuration
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=transit_ops_db
DB_USER=root
DB_PASS=12345678

# Authentication
JWT_SECRET=supersecretjwtkey12345
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d

# SMTP Configuration (Nodemailer) - Optional for Development (Will log to console if omitted)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
SMTP_FROM=TransitOps <your_email@gmail.com>
```

Initialize and run the backend:
```bash
# Setup database schema and initial mock data
npm run db:create
npm run db:migrate
npm run db:seed

# Start the server
npm run dev
```

### 2. Frontend Setup

Open a new terminal and navigate to the `frontend` directory:
```bash
cd frontend
npm install
```

Create a `.env.local` file in the `frontend/` directory:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

Start the frontend application:
```bash
npm run dev
```

The platform is now fully operational at [http://localhost:3000](http://localhost:3000).

---

## 🧪 Testing

The backend includes a comprehensive, 125-test suite utilizing Jest and an in-memory SQLite database, guaranteeing zero-friction testing without requiring MySQL to be active.

To run the test suite:
```bash
cd backend
npm test
```
To run tests with verbose output outlining every business logic check:
```bash
npm run test:verbose
```

---

## 🔑 Pre-seeded Accounts

Upon running `npm run db:seed`, the database is populated with initial accounts for testing all RBAC levels:

| Email | Password | Role |
|---|---|---|
| `manager@transitops.com` | `password123` | Fleet Manager |
| `driver@transitops.com` | `password123` | Driver |
| `safety@transitops.com` | `password123` | Safety Officer |
| `finance@transitops.com` | `password123` | Financial Analyst |

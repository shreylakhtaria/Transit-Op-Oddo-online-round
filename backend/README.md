# TransitOps Backend - Smart Transport Operations Platform

A production-grade, secure, and highly optimized backend API built for the Smart Transport Operations Platform. It manages real-time fleet operations, trip lifecycles, maintenance scheduling, expense tracking, and deep operational analytics.

This project was built as a hackathon submission.

---

## 👥 Meet the Team

We are a group of 4 passionate developers:
- **Kathan Modh**
- **Om Rahisya**
- **Pratham Patel**
- **Shrey Lakhataria**

---

## 🛠️ Technical Stack

- **Runtime Environment:** [Node.js](https://nodejs.org/) (v18+)
- **Application Framework:** [Express.js](https://expressjs.com/) (ESM modules)
- **Database Engine:** [MySQL](https://www.mysql.com/)
- **ORM / Database Layer:** [Sequelize](https://sequelize.org/) (with migrations, seeders, and transactional integrity)
- **Validation Engine:** [Zod](https://zod.dev/) (for runtime schema validation and request sanitization)
- **Security & Authorization:**
  - Password hashing via [bcryptjs](https://github.com/dcodeIO/bcrypt.js)
  - Token-based authentication via [JSON Web Tokens (JWT)](https://jwt.io/) (short-lived access tokens and database-tracked refresh tokens)
- **SMTP Notification Engine:** [Nodemailer](https://nodemailer.com/) (for secure mail delivery of OTPs and driver notifications)

---

## 🚀 Core Features

### 1. Two-Step Authentication & Verification (OTP)
* **Credentials Verification:** Standard secure login checks credentials against hashed passwords using `bcrypt`.
* **OTP Notification Delivery:** Generates a 6-digit random code and emails it to the user's registered address via SMTP (Nodemailer).
* **Two-Step Login Validation:** Generates a short-lived `tempToken` JWT (valid for 5 minutes). Complete login is finalized only by submitting the OTP code alongside this token, which issues the final JWT access and refresh tokens.
* **Fallback console logging:** In development, if SMTP configurations are omitted, the code gracefully falls back to logging the generated OTP to the server console.

### 2. Fleet & Personnel Management
* **Vehicle Registry:** Manages technical specifications of the vehicles (e.g. registration numbers, model, type, max load capacity, odometer readings, status).
* **Driver Management:** Tracks driver status, licenses, categories, expiry dates, and safety scores.
* **Automated Expiry Alerts:** Daily cron-compatible alerts check driver license expiry and email automated notification warnings if a driver's license is within 30 days of expiring.

### 3. Trip Lifecycle & Business Rules Engine
* **Asset Dispatch Validations:**
  - Prevents assigning retired or in-maintenance (`In Shop`) vehicles.
  - Rejects drivers with expired licenses or `Suspended` status.
  - Rejects cargo weights that exceed a vehicle's maximum load capacity.
  - Prevents assigning vehicles or drivers currently flagged as `On Trip`.
* **State Updates:**
  - Dispatching a trip automatically transitions vehicles and drivers to the `On Trip` status.
  - Completing a trip restores them to `Available`, updates the vehicle odometer, logs fuel consumed, and adds an expense log.
  - Cancelling restores dispatched assets to `Available`.

### 4. Maintenance & Operations Workshop
* **Active Maintenance:** Start maintenance jobs to transition vehicles directly to `In Shop`.
* **Cost Logging:** Maintenance costs are automatically synchronized into the global financial expenses.
* **Workshop Closure:** Closing maintenance logs updates vehicle statuses back to `Available` (unless marked `Retired`).

### 5. Expense Tracking & Fuel Management
* **Operational Expense Duplication:** Fuel logs are recorded in detail and automatically duplicated into the general financial expenses table under the `Fuel` category.
* **Category Tagging:** Expenses are categorized (`Fuel`, `Maintenance`, `Toll`, `Other`) for fine-grained budget audits.
* **Aggregated Cost Audit:** Computes operational costs (Fuel + Maintenance) and lifetime expenditures per vehicle.

### 6. Operational Analytics & CSV Reporting
* **Dashboard KPIs:** Dynamically calculates total available/active/in-shop vehicles, active/pending trips, drivers on duty, and total fleet utilization metrics.
* **Return on Investment (ROI):** Computes financial return ratios per vehicle using `(Revenue - (Maintenance + Fuel)) / Acquisition Cost`.
* **Fuel Efficiency:** Calculates real-time efficiency metrics `(Distance / Fuel Consumed)` per vehicle based on completed trips.
* **CSV Data Export:** Provides an endpoint to generate and download a clean CSV report containing all fleet statistics, operating costs, and ROI metrics.

---

## 📦 Database Schema Design

The MySQL database schema is structured as follows:
- **Roles:** System permission configuration (`Fleet Manager`, `Driver`, `Safety Officer`, `Financial Analyst`).
- **Users:** Login registry referencing `Roles`.
- **Otps:** Verification storage with user constraints and expiration periods.
- **RefreshTokens:** Session validation records.
- **Vehicles:** Physical asset management.
- **Drivers:** Professional profiles referencing `Users`.
- **Trips:** Dispatch records referencing `Vehicles` and `Drivers`.
- **MaintenanceLogs:** Maintenance tracking records referencing `Vehicles`.
- **FuelLogs:** Fuel consumption logs referencing `Vehicles` and `Trips`.
- **Expenses:** Operations financial logs referencing `Vehicles` and `Trips`.

---

## ⚙️ Installation & Setup

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (v18+)
- [MySQL Server](https://www.mysql.com/)

### 2. Install Dependencies
Navigate to the `backend/` folder and run:
```bash
npm install
```

### 3. Configure Environment Variables
Create a `.env` file in the `backend/` folder (or copy from the provided template) and fill in your configurations:
```env
PORT=8000
NODE_ENV=development

# Database configuration
DB_HOST=localhost
DB_PORT=3306
DB_NAME=transit_ops_db
DB_USER=root
DB_PASS=your_db_password

# Authentication
JWT_SECRET=your_super_secret_jwt_key
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d

# SMTP Configuration (Nodemailer)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
SMTP_FROM=TransitOps <your_email@gmail.com>
```

### 4. Database Setup & Migrations
Create the database and run all migrations and seeders to populate initial roles and mock users:
```bash
# Create database
npm run db:create

# Run schema migrations
npm run db:migrate

# Seed database with initial data
npm run db:seed
```

### 5. Running the Application
Start the server in development mode with hot-reloading:
```bash
npm run dev
```
The server will start, initialize the Nodemailer SMTP transporter, connect to MySQL, and run on `http://localhost:8000`.

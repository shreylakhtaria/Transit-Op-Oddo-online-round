# TransitOps Frontend - Smart Transport Operations Platform

A premium, glassmorphism-inspired Next.js frontend built for the TransitOps fleet management platform. It features real-time data visualization, full role-based access control (RBAC), and responsive dashboards designed to provide deep operational insights at a glance.

This project was built as a hackathon submission.

---

## 🎨 Design Philosophy

TransitOps was built with a highly premium, modern aesthetic targeting mission-control level visibility.
- **Dark Mode & Glassmorphism:** Semi-transparent panels with luminous borders create a state-of-the-art visual hierarchy.
- **Dynamic Feedback:** Subtle micro-animations and hover effects (glow borders, color shifts) provide immediate tactile feedback.
- **Action-Oriented Typography:** Clean monospace metrics combined with highly legible sans-serif fonts ensure critical data (status, reg numbers, ROI) pops out instantly.

---

## 🛠️ Technical Stack

- **Framework:** [Next.js 14](https://nextjs.org/) (App Router)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/) (using native CSS custom properties for rich thematic tokens)
- **State Management & Fetching:** [TanStack React Query (v5)](https://tanstack.com/query/latest)
- **Icons:** [Lucide React](https://lucide.dev/)
- **Charts:** [Recharts](https://recharts.org/)
- **Language:** TypeScript

---

## 🚀 Core Features

### 1. Unified Mission Control Dashboard
- Real-time KPIs for Active Vehicles, Vehicles in Maintenance, and Active/Pending Trips.
- Dynamic filtering by **Vehicle Type** and **Status**, which updates all charts and recent trip tables via URL query parameters.
- Fleet utilization visualizer showcasing Available, On Trip, and In Shop assets.

### 2. Fleet & Driver Registries
- Clean tabular tracking of vehicles and drivers.
- **Vehicle Document Management:** Attached slide-over/modal for tracking registration, insurance, and emission documents securely.
- Role-gated capabilities (e.g., only Fleet Managers can add new vehicles).

### 3. Trip Dispatching Engine
- Full trip lifecycle execution (`Draft ➔ Dispatched ➔ Completed ➔ Cancelled`).
- Validates payload weights and calculates actual ROI natively by tracking fuel efficiency automatically upon trip completion.

### 4. Financial & Analytics Views
- **Monthly Revenue:** Interactive bar charts tracking revenue trends over time.
- **Costliest Vehicles:** Ranked visual breakdown of the most expensive assets based on accumulated maintenance and fuel logs.
- **PDF & CSV Export:** Direct single-click export generation for operational reports and audits.

### 5. Secure Authentication
- Full multi-step OTP-based authentication.
- Short-lived Access Tokens handled automatically by a robust generic API client.
- Soft-refreshing session handling without disrupting the user flow.

---

## ⚙️ Installation & Setup

### 1. Prerequisites
- Node.js (v18+)
- Running TransitOps Backend Server (typically on port 8000)

### 2. Install Dependencies
Navigate to the `frontend/` folder and run:
```bash
npm install
```

### 3. Configure Environment Variables
Create a `.env.local` file in the root of the `frontend/` folder:
```env
# The URL pointing to your local running TransitOps backend API
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

### 4. Run the Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to launch the application.

---

## 🔐 Role-Based Access Control (RBAC)

The frontend UI dynamically adapts based on the signed-in user's role (enforced tightly by the backend):
- **Fleet Manager:** Full create/update/delete access across vehicles, dispatching, and settings.
- **Driver:** Can access and manage assigned trips and logging.
- **Safety Officer:** Manages driver compliance, tracks licenses, and can trigger system-wide automated email warnings for expiring licenses.
- **Financial Analyst:** Read-only access to operations but full analytical tracking of fleet utilization and maintenance reporting.

/**
 * Shapes verified against the running backend (branch `kathan`), not the docs.
 * Two things to keep in mind when using these:
 *   - list endpoints return a BARE ARRAY — no `{data}` envelope, no pagination.
 *   - money/percent fields arrive as numbers already, not strings.
 */

export type VehicleStatus = "Available" | "On Trip" | "In Maintenance" | "Retired";
export type DriverStatus = "Available" | "On Trip" | "Off Duty" | "Suspended";
export type TripStatus =
  | "Draft"
  | "Dispatched"
  | "In Progress"
  | "Completed"
  | "Cancelled";
export type MaintenanceStatus = "Open" | "Closed";

export type Vehicle = {
  id: number;
  registrationNumber: string;
  model: string;
  type: string;
  maxLoadCapacity: number;
  odometer: number;
  acquisitionCost: number;
  status: VehicleStatus;
  createdAt: string;
  updatedAt: string;
};

export type Driver = {
  id: number;
  name: string;
  licenseNumber: string;
  licenseCategory: string;
  /** ISO date (YYYY-MM-DD) */
  licenseExpiryDate: string;
  contactNumber: string;
  safetyScore: number;
  status: DriverStatus;
  userId: string;
  user?: { id: string; name: string; email: string };
  createdAt: string;
  updatedAt: string;
};

export type Trip = {
  id: number;
  source: string;
  destination: string;
  status: TripStatus;
  vehicleId: number | null;
  driverId: number | null;
  vehicle?: Vehicle;
  driver?: Driver;
  scheduledAt?: string | null;
  completedAt?: string | null;
  revenue?: number;
  createdAt: string;
  updatedAt: string;
};

export type MaintenanceLog = {
  id: number;
  vehicleId: number;
  serviceType: string;
  cost: number;
  status: MaintenanceStatus;
  serviceDate?: string;
  vehicle?: Vehicle;
  createdAt: string;
  updatedAt: string;
};

export type Expense = {
  id: number;
  vehicleId: number;
  tripId?: number | null;
  type: string;
  amount: number;
  vehicle?: Vehicle;
  createdAt: string;
  updatedAt: string;
};

/** GET /settings — a flat string key/value map, not a typed object. */
export type Settings = Record<string, string>;

export type VehicleCostRow = {
  id: number;
  registrationNumber: string;
  model: string;
  type: string;
  odometer: number;
  fuelCost: number;
  maintenanceCost: number;
  totalOperationalCost: number;
  revenue: number;
  roi: number;
  fuelEfficiency: number;
};

export type DashboardData = {
  kpis: {
    activeVehicles: number;
    availableVehicles: number;
    vehiclesInMaintenance: number;
    activeTrips: number;
    pendingTrips: number;
    driversOnDuty: number;
    fleetUtilization: number;
  };
  chartData: VehicleCostRow[];
  recentTrips: Trip[];
};

export type MonthlyRevenue = { month: string; revenue: number };

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role?: { name: string };
};

export type LoginResponse = { message: string; tempToken: string };
export type VerifyOtpResponse = {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
};

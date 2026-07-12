/**
 * Shapes verified against the running backend (branch `kathan`), not the docs.
 * Two things to keep in mind when using these:
 *   - list endpoints return a BARE ARRAY — no `{data}` envelope, no pagination.
 *   - money/percent fields arrive as numbers already, not strings.
 */

// Enums below are lifted verbatim from the Sequelize models — do not "tidy" them
// to match the Figma copy. The design says "In Maintenance"/"In Progress"/"Open";
// the database says "In Shop"/(nothing)/"Active". The database wins.
export type VehicleStatus = "Available" | "On Trip" | "In Shop" | "Retired";
export type DriverStatus = "Available" | "On Trip" | "Off Duty" | "Suspended";
export type TripStatus = "Draft" | "Dispatched" | "Completed" | "Cancelled";
export type MaintenanceStatus = "Active" | "Closed";
export type ExpenseCategory = "Fuel" | "Maintenance" | "Toll" | "Other";

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
  cargoWeight?: number;
  plannedDistance?: number;
  actualDistance?: number | null;
  fuelConsumed?: number | null;
  revenue?: number;
  dispatchDate?: string | null;
  completionDate?: string | null;
  vehicle?: Vehicle;
  driver?: Driver;
  createdAt: string;
  updatedAt: string;
};

export type MaintenanceLog = {
  id: number;
  vehicleId: number;
  /** The work performed. The API calls this `description`, not `serviceType`. */
  description: string;
  cost: number;
  /** YYYY-MM-DD. Required by POST /maintenance. */
  startDate: string;
  endDate?: string | null;
  status: MaintenanceStatus;
  vehicle?: Vehicle;
  createdAt: string;
  updatedAt: string;
};

/** POST /maintenance rejects anything missing description or startDate. */
export type CreateMaintenanceBody = {
  vehicleId: number;
  description: string;
  cost: number;
  startDate: string;
};

export type Expense = {
  id: number;
  vehicleId: number;
  tripId?: number | null;
  description: string;
  amount: number;
  category: ExpenseCategory;
  /** YYYY-MM-DD */
  date: string;
  vehicle?: Vehicle;
  createdAt: string;
  updatedAt: string;
};

export type FuelLog = {
  id: number;
  vehicleId: number;
  tripId?: number | null;
  liters: number;
  cost: number;
  date: string;
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

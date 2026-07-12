"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "./client";
import { ApiError } from "./client";
import type {
  AdminUser,
  CompleteTripBody,
  CreateDriverBody,
  CreateMaintenanceBody,
  CreateTripBody,
  CreateVehicleBody,
  DispatchableAssets,
  LogExpenseBody,
  LogFuelBody,
  DashboardData,
  Driver,
  Expense,
  FuelLog,
  MaintenanceLog,
  MonthlyRevenue,
  Role,
  Settings,
  Trip,
  Vehicle,
  VehicleCostRow,
} from "./types";

export const keys = {
  vehicles: ["vehicles"] as const,
  drivers: ["drivers"] as const,
  trips: ["trips"] as const,
  maintenance: ["maintenance"] as const,
  expenses: ["expenses"] as const,
  fuelLogs: ["expenses", "fuel"] as const,
  dispatchable: ["trips", "dispatchable-assets"] as const,
  roles: ["roles"] as const,
  users: ["users"] as const,
  settings: ["settings"] as const,
  dashboard: ["analytics", "dashboard"] as const,
  monthlyRevenue: ["analytics", "monthly-revenue"] as const,
  topCostliest: ["analytics", "top-costliest"] as const,
};

export const useVehicles = () =>
  useQuery({ queryKey: keys.vehicles, queryFn: () => api.get<Vehicle[]>("/vehicles") });

export const useDrivers = () =>
  useQuery({ queryKey: keys.drivers, queryFn: () => api.get<Driver[]>("/drivers") });

export const useTrips = () =>
  useQuery({ queryKey: keys.trips, queryFn: () => api.get<Trip[]>("/trips") });

export const useMaintenance = () =>
  useQuery({
    queryKey: keys.maintenance,
    queryFn: () => api.get<MaintenanceLog[]>("/maintenance"),
  });

export const useExpenses = () =>
  useQuery({ queryKey: keys.expenses, queryFn: () => api.get<Expense[]>("/expenses") });

export const useSettings = () =>
  useQuery({ queryKey: keys.settings, queryFn: () => api.get<Settings>("/settings") });

export const useFuelLogs = () =>
  useQuery({
    queryKey: keys.fuelLogs,
    queryFn: () => api.get<FuelLog[]>("/expenses/fuel"),
  });

export const useRoles = () =>
  useQuery({ queryKey: keys.roles, queryFn: () => api.get<Role[]>("/roles") });

/**
 * GET /users is Fleet Manager only. A Dispatcher or Safety Officer gets a 403 —
 * that's the RBAC working, not a failure, so don't retry it and let callers
 * render the roles-only view instead of an error.
 */
export const useUsers = () =>
  useQuery({
    queryKey: keys.users,
    queryFn: () => api.get<AdminUser[]>("/users"),
    retry: (_count, error) =>
      !(error instanceof ApiError && error.status === 403),
  });

export function useUpdateUserRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, roleName }: { id: string; roleName: string }) =>
      api.patch<AdminUser>(`/users/${id}/role`, { roleName }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.users });
      qc.invalidateQueries({ queryKey: keys.roles });
    },
  });
}

export const useDashboard = () =>
  useQuery({
    queryKey: keys.dashboard,
    queryFn: () => api.get<DashboardData>("/analytics/dashboard"),
  });

export const useMonthlyRevenue = () =>
  useQuery({
    queryKey: keys.monthlyRevenue,
    queryFn: () => api.get<MonthlyRevenue[]>("/analytics/monthly-revenue"),
  });

export const useTopCostliest = (limit = 5) =>
  useQuery({
    queryKey: [...keys.topCostliest, limit],
    queryFn: () => api.get<VehicleCostRow[]>(`/analytics/top-costliest?limit=${limit}`),
  });

/**
 * Anything that changes fleet state can ripple into the dashboard and analytics
 * (a new vehicle changes the counts; completing a trip changes revenue), so mutations
 * invalidate those too rather than leaving stale numbers on screen.
 */
function useFleetMutation<TBody, TResult>(
  fn: (body: TBody) => Promise<TResult>,
  touches: readonly (readonly string[])[],
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: () => {
      for (const key of touches) qc.invalidateQueries({ queryKey: key });
      qc.invalidateQueries({ queryKey: keys.dashboard });
      qc.invalidateQueries({ queryKey: keys.monthlyRevenue });
      qc.invalidateQueries({ queryKey: keys.topCostliest });
    },
  });
}

export const useCreateVehicle = () =>
  useFleetMutation(
    (body: CreateVehicleBody) => api.post<Vehicle>("/vehicles", body),
    [keys.vehicles],
  );

export const useUpdateVehicle = () =>
  useFleetMutation(
    ({ id, ...body }: { id: number } & Partial<CreateVehicleBody>) =>
      api.put<Vehicle>(`/vehicles/${id}`, body),
    [keys.vehicles],
  );

export const useDeleteVehicle = () =>
  useFleetMutation(
    (id: number) => api.delete<void>(`/vehicles/${id}`),
    [keys.vehicles],
  );

export const useCreateDriver = () =>
  useFleetMutation(
    (body: CreateDriverBody) => api.post<Driver>("/drivers", body),
    [keys.drivers],
  );

export const useUpdateDriver = () =>
  useFleetMutation(
    ({ id, ...body }: { id: number } & Partial<CreateDriverBody>) =>
      api.put<Driver>(`/drivers/${id}`, body),
    [keys.drivers],
  );

export const useDeleteDriver = () =>
  useFleetMutation(
    (id: number) => api.delete<void>(`/drivers/${id}`),
    [keys.drivers],
  );

/** Vehicles/drivers eligible for a new trip — the API filters out In Shop, On Trip, etc. */
export const useDispatchableAssets = () =>
  useQuery({
    queryKey: keys.dispatchable,
    queryFn: () => api.get<DispatchableAssets>("/trips/dispatchable-assets"),
  });

export const useCreateTrip = () =>
  useFleetMutation(
    (body: CreateTripBody) => api.post<Trip>("/trips", body),
    [keys.trips, keys.vehicles, keys.drivers, keys.dispatchable],
  );

export const useDispatchTrip = () =>
  useFleetMutation(
    (id: number) => api.post<Trip>(`/trips/${id}/dispatch`),
    [keys.trips, keys.vehicles, keys.drivers, keys.dispatchable],
  );

export const useCompleteTrip = () =>
  useFleetMutation(
    ({ id, ...body }: { id: number } & CompleteTripBody) =>
      api.post<Trip>(`/trips/${id}/complete`, body),
    [keys.trips, keys.vehicles, keys.drivers, keys.dispatchable, keys.expenses],
  );

export const useCancelTrip = () =>
  useFleetMutation(
    (id: number) => api.post<Trip>(`/trips/${id}/cancel`),
    [keys.trips, keys.vehicles, keys.drivers, keys.dispatchable],
  );

export const useCloseMaintenance = () =>
  useFleetMutation(
    (id: number) => api.post<MaintenanceLog>(`/maintenance/${id}/close`),
    [keys.maintenance, keys.vehicles],
  );

export const useLogFuel = () =>
  useFleetMutation(
    (body: LogFuelBody) => api.post<FuelLog>("/expenses/fuel", body),
    [keys.fuelLogs, keys.expenses],
  );

export const useLogExpense = () =>
  useFleetMutation(
    (body: LogExpenseBody) => api.post<Expense>("/expenses/other", body),
    [keys.expenses],
  );

export function useCreateMaintenance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateMaintenanceBody) =>
      api.post<MaintenanceLog>("/maintenance", body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.maintenance });
      qc.invalidateQueries({ queryKey: keys.vehicles });
    },
  });
}

export function useUpdateSettings() {
  const qc = useQueryClient();
  return useMutation({
    // The API takes an array of {key, value}, not the flat map it returns.
    mutationFn: (settings: Settings) =>
      api.put<Settings>("/settings", {
        settings: Object.entries(settings).map(([key, value]) => ({ key, value })),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.settings }),
  });
}

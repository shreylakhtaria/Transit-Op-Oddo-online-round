"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "./client";
import { ApiError } from "./client";
import type {
  AdminUser,
  CreateMaintenanceBody,
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

export function useCreateVehicle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Partial<Vehicle>) => api.post<Vehicle>("/vehicles", body),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.vehicles }),
  });
}

export function useCreateDriver() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Partial<Driver>) => api.post<Driver>("/drivers", body),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.drivers }),
  });
}

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

export function useCreateTrip() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Partial<Trip>) => api.post<Trip>("/trips", body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.trips });
    },
  });
}

export function useDispatchTrip() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.post<Trip>(`/trips/${id}/dispatch`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.trips });
      qc.invalidateQueries({ queryKey: keys.vehicles });
      qc.invalidateQueries({ queryKey: keys.drivers });
    },
  });
}

export function useCompleteTrip() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: { id: number; actualDistance: number; fuelConsumed: number; fuelCost?: number; revenue: number }) =>
      api.post<Trip>(`/trips/${id}/complete`, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.trips });
      qc.invalidateQueries({ queryKey: keys.vehicles });
      qc.invalidateQueries({ queryKey: keys.drivers });
      qc.invalidateQueries({ queryKey: keys.expenses });
      qc.invalidateQueries({ queryKey: keys.fuelLogs });
      qc.invalidateQueries({ queryKey: keys.dashboard });
    },
  });
}

export function useCancelTrip() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.post<Trip>(`/trips/${id}/cancel`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.trips });
      qc.invalidateQueries({ queryKey: keys.vehicles });
      qc.invalidateQueries({ queryKey: keys.drivers });
    },
  });
}

export function useCloseMaintenance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, endDate }: { id: number; endDate?: string }) =>
      api.post<MaintenanceLog>(`/maintenance/${id}/close`, { endDate }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.maintenance });
      qc.invalidateQueries({ queryKey: keys.vehicles });
      qc.invalidateQueries({ queryKey: keys.dashboard });
    },
  });
}

export function useCreateFuelLog() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { vehicleId: number; tripId?: number; liters: number; cost: number; date: string }) =>
      api.post<FuelLog>("/expenses/fuel", body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.fuelLogs });
      qc.invalidateQueries({ queryKey: keys.expenses });
      qc.invalidateQueries({ queryKey: keys.dashboard });
    },
  });
}

export function useCreateExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { vehicleId: number; description: string; amount: number; category: string; date: string }) =>
      api.post<Expense>("/expenses/other", body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.expenses });
      qc.invalidateQueries({ queryKey: keys.dashboard });
    },
  });
}

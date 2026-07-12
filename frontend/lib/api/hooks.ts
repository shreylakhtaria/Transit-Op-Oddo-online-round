"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "./client";
import type {
  DashboardData,
  Driver,
  Expense,
  MaintenanceLog,
  MonthlyRevenue,
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
    mutationFn: (body: Partial<MaintenanceLog>) =>
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

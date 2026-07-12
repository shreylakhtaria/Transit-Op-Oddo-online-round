"use client";

import type { ReactNode } from "react";
import { useMemo } from "react";
import {
  BarChart3,
  Download,
  Fuel,
  ListFilter,
  Plus,
  ReceiptText,
  Sparkles,
  Wallet,
} from "lucide-react";
import {
  Button,
  Panel,
  PageHeader,
  Table,
  Td,
  Th,
  Tr,
} from "@/components/ui";
import {
  EmptyState,
  ErrorState,
  Skeleton,
  TableSkeleton,
} from "@/components/ui/async";
import { useDashboard, useExpenses, useFuelLogs } from "@/lib/api/hooks";

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const currencyCents = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const litres = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

const dateFmt = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

/**
 * `2026-07-12` → `Jul 12, 2026`. Built from the parts rather than handed to
 * `new Date(iso)`, which reads a bare date as UTC midnight and so renders as the
 * *previous* day for anyone west of Greenwich.
 */
function formatDate(iso: string) {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  if (!y || !m || !d) return iso;
  return dateFmt.format(new Date(y, m - 1, d));
}

/** KPI tile — eyebrow + big figure + a slot for the footer detail. */
function StatTile({
  label,
  value,
  accent = false,
  children,
}: {
  label: string;
  value: string;
  accent?: boolean;
  children?: ReactNode;
}) {
  return (
    <div
      className={`glass flex flex-1 flex-col gap-3 rounded-xl px-5 pb-6 pt-5 ${
        accent ? "border-accent/40!" : ""
      }`}
    >
      <p className={`label-field ${accent ? "text-accent" : "text-muted"}`}>
        {label}
      </p>
      <div className="flex items-baseline gap-2">
        <span className="font-mono text-2xl font-semibold leading-8 text-ink">
          {value}
        </span>
      </div>
      {children}
    </div>
  );
}

function StatTileSkeleton() {
  return (
    <div className="glass flex flex-1 flex-col gap-3 rounded-xl px-5 pb-6 pt-5">
      <Skeleton className="h-3 w-32" />
      <Skeleton className="h-8 w-24" />
      <Skeleton className="h-1 w-full" />
    </div>
  );
}

export default function FuelPage() {
  const {
    data: dashboard,
    isLoading: dashboardLoading,
    error: dashboardError,
    refetch: refetchDashboard,
  } = useDashboard();

  const {
    data: expenseData,
    isLoading: expensesLoading,
    error: expensesError,
    refetch: refetchExpenses,
  } = useExpenses();

  const {
    data: fuelData,
    isLoading: fuelLoading,
    error: fuelError,
    refetch: refetchFuel,
  } = useFuelLogs();

  const expenses = useMemo(() => expenseData ?? [], [expenseData]);
  const fuelLogs = useMemo(() => fuelData ?? [], [fuelData]);

  const costs = useMemo(() => {
    const rows = dashboard?.chartData ?? [];
    return {
      fuel: rows.reduce((sum, r) => sum + (r.fuelCost ?? 0), 0),
      maintenance: rows.reduce((sum, r) => sum + (r.maintenanceCost ?? 0), 0),
      total: rows.reduce((sum, r) => sum + (r.totalOperationalCost ?? 0), 0),
      maintVehicles: rows.filter((r) => (r.maintenanceCost ?? 0) > 0).length,
    };
  }, [dashboard]);

  const expenseTotal = useMemo(
    () => expenses.reduce((sum, e) => sum + (e.amount ?? 0), 0),
    [expenses],
  );

  // Share of total operational cost that is fuel — drives the meter bar.
  const fuelShare =
    costs.total > 0 ? Math.min(100, (costs.fuel / costs.total) * 100) : 0;

  return (
    <>
      <PageHeader
        crumbs={[]}
        title="Fuel & Expenses"
        subtitle="Real-time expenditure tracking and operational cost analysis."
        action={
          <div className="flex items-center gap-3">
            <Button
              icon={<Plus className="size-3.5" strokeWidth={3} />}
              className="px-5 py-2.5 text-sm"
            >
              Log Fuel
            </Button>
            <Button
              variant="outline"
              icon={<ReceiptText className="size-4" />}
              className="px-5 py-2.5 text-sm"
            >
              Add Expense
            </Button>
            <Button
              variant="outline"
              icon={<Download className="size-4" />}
              className="border-transparent bg-surface-3 px-5 py-2.5 text-sm"
            >
              Export CSV
            </Button>
          </div>
        }
      />

      {dashboardError ? (
        <ErrorState error={dashboardError} onRetry={() => refetchDashboard()} />
      ) : (
        <div className="flex items-stretch gap-4">
          {dashboardLoading ? (
            <>
              <StatTileSkeleton />
              <StatTileSkeleton />
              <StatTileSkeleton />
            </>
          ) : (
            <>
              <StatTile
                label="TOTAL FUEL COST"
                value={currency.format(costs.fuel)}
              >
                <div className="mt-auto h-1 w-full overflow-hidden rounded-full bg-surface-4">
                  <div
                    className="h-full bg-accent"
                    style={{ width: `${fuelShare}%` }}
                  />
                </div>
              </StatTile>

              <StatTile
                label="LOGGED EXPENSES"
                value={currency.format(expenseTotal)}
              >
                <p className="pt-1 text-[10px] leading-5 text-muted">
                  {expenses.length} expense
                  {expenses.length === 1 ? "" : "s"} recorded
                </p>
              </StatTile>

              <StatTile
                label="PENDING MAINTENANCE"
                value={currency.format(costs.maintenance)}
                accent
              >
                <p className="pt-1 text-[10px] leading-5 text-muted">
                  Across {costs.maintVehicles} vehicle
                  {costs.maintVehicles === 1 ? "" : "s"}
                </p>
              </StatTile>
            </>
          )}
        </div>
      )}

      <div className="flex items-start gap-4">
        <Panel className="flex-1 overflow-hidden">
          <div className="flex items-center justify-between border-b border-line px-4 py-4">
            <div className="flex items-center gap-2">
              <Fuel className="size-4 text-accent" />
              <h2 className="text-xl font-semibold text-ink">Fuel Logs</h2>
            </div>
            {/* GET /expenses/fuel returns the full history, unfiltered — so the
                chip reports the real count rather than claiming a date window. */}
            {!fuelLoading && !fuelError && fuelLogs.length > 0 && (
              <span className="rounded bg-surface-2 px-2 py-1 text-xs text-muted">
                {fuelLogs.length} log{fuelLogs.length === 1 ? "" : "s"}
              </span>
            )}
          </div>

          {fuelError ? (
            <ErrorState error={fuelError} onRetry={() => refetchFuel()} />
          ) : fuelLoading ? (
            <TableSkeleton cols={4} />
          ) : fuelLogs.length === 0 ? (
            <EmptyState
              title="No fuel logs yet"
              hint="Fuel purchases logged against a vehicle will appear here."
            />
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th className="px-3 whitespace-nowrap">Vehicle</Th>
                  <Th className="px-3 whitespace-nowrap">Date</Th>
                  <Th align="right" className="px-3 whitespace-nowrap">
                    Liters
                  </Th>
                  <Th align="right" className="px-3 whitespace-nowrap">
                    Fuel Cost
                  </Th>
                </tr>
              </thead>
              <tbody>
                {fuelLogs.map((log) => (
                  <Tr key={log.id}>
                    <Td
                      mono
                      className="px-3 whitespace-nowrap text-[13px] text-ink"
                    >
                      {log.vehicle?.registrationNumber ??
                        log.vehicle?.model ??
                        "—"}
                    </Td>
                    <Td
                      mono
                      className="px-3 whitespace-nowrap text-[13px] text-muted"
                    >
                      {formatDate(log.date)}
                    </Td>
                    <Td
                      align="right"
                      mono
                      className="px-3 whitespace-nowrap text-[13px] text-ink"
                    >
                      {litres.format(log.liters ?? 0)} L
                    </Td>
                    <Td
                      align="right"
                      mono
                      className="px-3 whitespace-nowrap text-[13px] font-bold text-accent"
                    >
                      {currencyCents.format(log.cost ?? 0)}
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
          )}
        </Panel>

        <Panel className="flex-1 overflow-hidden">
          <div className="flex items-center justify-between border-b border-line px-4 py-4">
            <div className="flex items-center gap-2">
              <Wallet className="size-4 text-accent" />
              <h2 className="text-xl font-semibold text-ink">Other Expenses</h2>
            </div>
            <button
              type="button"
              className="flex size-8 items-center justify-center rounded border border-line text-muted transition hover:text-ink"
              aria-label="Filter expenses"
            >
              <ListFilter className="size-4" />
            </button>
          </div>

          {expensesError ? (
            <ErrorState
              error={expensesError}
              onRetry={() => refetchExpenses()}
            />
          ) : expensesLoading ? (
            <TableSkeleton cols={3} />
          ) : expenses.length === 0 ? (
            <EmptyState
              title="No expenses recorded yet"
              hint="Tolls, permits and other trip costs will appear here once they are logged."
            />
          ) : (
            /* The API exposes a single `type` + `amount` per expense — there is no
               toll/other/maintenance breakdown to render, so the columns match reality. */
            <Table>
              <thead>
                <tr>
                  <Th className="px-3 whitespace-nowrap">Vehicle</Th>
                  <Th className="px-3 whitespace-nowrap">Type</Th>
                  <Th align="right" className="px-3 whitespace-nowrap">
                    Amount
                  </Th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((e) => (
                  <Tr key={e.id}>
                    <Td className="px-3 text-sm">
                      <span className="block whitespace-nowrap font-mono text-[13px] text-ink">
                        {e.vehicle?.registrationNumber ?? `#${e.vehicleId}`}
                      </span>
                      {e.tripId != null && (
                        <span className="block whitespace-nowrap font-mono text-[10px] text-muted">
                          Trip #{e.tripId}
                        </span>
                      )}
                    </Td>
                    <Td className="px-3 whitespace-nowrap text-[13px] text-muted">
                      {e.category}
                    </Td>
                    <Td
                      align="right"
                      mono
                      className="px-3 whitespace-nowrap text-[13px] font-bold text-ink"
                    >
                      {currencyCents.format(e.amount ?? 0)}
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
          )}
        </Panel>
      </div>

      <section className="relative overflow-hidden rounded-2xl border border-accent/25 bg-gradient-to-r from-surface-2 to-tertiary-dim p-8 backdrop-blur-[24px]">
        <div className="pointer-events-none absolute -bottom-20 -right-20 size-80 rounded-full bg-accent-faint blur-[32px]" />
        <div className="relative flex items-center justify-between gap-8">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <BarChart3 className="size-4 text-accent" />
              <span className="text-[11px] font-bold uppercase tracking-[2.2px] text-accent">
                Operational Insight
              </span>
            </div>
            <h2 className="text-5xl font-bold leading-[56px] tracking-[-0.96px] text-ink">
              Total Operational
              <br />
              Cost
            </h2>
            <p className="max-w-md text-sm leading-5 text-muted">
              Comprehensive aggregation of all logistics overhead including fuel
              acquisitions and linked maintenance work-orders.
            </p>
          </div>

          <div className="flex flex-col items-end">
            <div className="flex items-baseline gap-4">
              {dashboardLoading ? (
                <Skeleton className="h-[72px] w-64" />
              ) : (
                <span className="text-7xl font-bold leading-[72px] text-accent">
                  {currency.format(costs.total)}
                </span>
              )}
            </div>
            <div className="mt-4 flex items-center gap-2 rounded border border-accent-dim bg-accent-dim px-4 py-2">
              <Sparkles className="size-3.5 text-accent" />
              <span className="text-xs font-bold uppercase tracking-[1.2px] text-accent">
                Calculated: Fuel + Maintenance
              </span>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

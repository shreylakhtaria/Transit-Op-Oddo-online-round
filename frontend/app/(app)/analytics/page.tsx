"use client";

import { useState } from "react";
import {
  ArrowRight,
  Calendar,
  ChevronDown,
  Download,
  Fuel,
  Gauge,
  Landmark,
  Navigation,
  ShieldCheck,
  UserCog,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { useDashboard, useMonthlyRevenue, useTopCostliest } from "@/lib/api/hooks";
import type { VehicleCostRow } from "@/lib/api/types";
import { Button, Panel, PageHeader, Table, Td, Th, Tr } from "@/components/ui";
import { EmptyState, ErrorState, MockBadge, Skeleton } from "@/components/ui/async";

/* ------------------------------------------------------------- formatting */

const currency = (n: number) =>
  n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });

const compact = (n: number) =>
  n.toLocaleString("en-US", { maximumFractionDigits: 0 });

const decimal = (n: number) => n.toFixed(1);

/** Mean of a numeric projection, 0 for an empty array (never NaN). */
const mean = (rows: VehicleCostRow[], pick: (r: VehicleCostRow) => number) =>
  rows.length === 0 ? 0 : rows.reduce((sum, r) => sum + pick(r), 0) / rows.length;

const sum = (rows: VehicleCostRow[], pick: (r: VehicleCostRow) => number) =>
  rows.reduce((acc, r) => acc + pick(r), 0);

const MONTH_LABELS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

/** "2026-07" -> "Jul"; anything unexpected falls back to the raw string. */
const monthLabel = (month: string) => {
  const index = Number(month.split("-")[1]) - 1;
  return MONTH_LABELS[index] ?? month;
};

/* ---------------------------------------------------------------- KPI tiles */

type Kpi = {
  label: string;
  value: string;
  unit: string;
  unitLeading?: boolean;
  icon: LucideIcon;
  highlight?: boolean;
};

function KpiTile({ kpi }: { kpi: Kpi }) {
  const Icon = kpi.icon;

  return (
    <Panel
      className={`flex flex-1 flex-col gap-4 p-5 ${
        kpi.highlight ? "border-accent/40!" : ""
      }`}
    >
      <div className="flex items-start justify-between">
        <span className="label-eyebrow">{kpi.label}</span>
        <Icon className="size-[18px] text-accent" strokeWidth={1.75} />
      </div>

      <p className="flex items-baseline gap-2">
        {kpi.unitLeading && (
          <span className="text-sm font-medium text-muted">{kpi.unit}</span>
        )}
        <span
          className={`font-mono text-5xl font-bold tracking-[-0.96px] ${
            kpi.highlight ? "text-accent" : "text-ink"
          }`}
        >
          {kpi.value}
        </span>
        {!kpi.unitLeading && (
          <span
            className={`text-sm font-medium ${
              kpi.highlight ? "text-accent" : "text-muted"
            }`}
          >
            {kpi.unit}
          </span>
        )}
      </p>
    </Panel>
  );
}

/* ----------------------------------------------------------------- RBAC rows */
/* No user/role endpoint exists on the API yet — this table stays on mock data. */

type Role = {
  role: string;
  icon: LucideIcon;
  visibility: string;
  control: string;
  financial: string;
  financialMuted?: boolean;
  controlMuted?: boolean;
  status: string;
  admin: boolean;
};

const ROLES: Role[] = [
  {
    role: "Fleet Manager",
    icon: UserCog,
    visibility: "Full Organization",
    control: "Write / Dispatch",
    financial: "Read-only",
    financialMuted: true,
    status: "Admin",
    admin: true,
  },
  {
    role: "Dispatcher",
    icon: Navigation,
    visibility: "Live Fleet & Routing",
    control: "Write / Active Ops",
    financial: "Hidden",
    financialMuted: true,
    status: "Operator",
    admin: false,
  },
  {
    role: "Safety Officer",
    icon: ShieldCheck,
    visibility: "Incident Reports",
    control: "Read-only",
    financial: "Hidden",
    financialMuted: true,
    status: "Auditor",
    admin: false,
  },
  {
    role: "Financial Analyst",
    icon: Landmark,
    visibility: "Historical Billing",
    control: "Hidden",
    controlMuted: true,
    financial: "Full Approval",
    status: "Admin",
    admin: true,
  },
];

function RoleBadge({ children, admin }: { children: string; admin: boolean }) {
  return (
    <span
      className={`inline-flex items-center rounded border px-2 py-px text-[10px] font-bold uppercase ${
        admin
          ? "border-accent/20 bg-accent-dim text-accent"
          : "border-line bg-surface-4/50 text-ink"
      }`}
    >
      {children}
    </span>
  );
}

/* --------------------------------------------------- Top costliest vehicles */

/** Rank-coded bars: hottest first, cooling off down the list. */
const COST_TONES = [
  { bar: "bg-danger", amount: "text-danger" },
  { bar: "bg-tertiary", amount: "text-tertiary" },
  { bar: "bg-muted/40", amount: "text-muted" },
] as const;

const costTone = (i: number) => COST_TONES[Math.min(i, COST_TONES.length - 1)];

/* --------------------------------------------------------------------- Page */

const RANGES = ["Last 7 Days", "Last 30 Days", "Last Quarter", "Year to Date"];

export default function AnalyticsPage() {
  const [range, setRange] = useState("Last 30 Days");
  const [open, setOpen] = useState(false);

  const dashboard = useDashboard();
  const revenue = useMonthlyRevenue();
  const costliest = useTopCostliest(5);

  const chartData = dashboard.data?.chartData ?? [];
  const kpis: Kpi[] = [
    {
      label: "Fuel Efficiency",
      value: decimal(mean(chartData, (r) => r.fuelEfficiency)),
      unit: "km/l",
      icon: Fuel,
    },
    {
      label: "Fleet Utilization",
      value: decimal(dashboard.data?.kpis.fleetUtilization ?? 0),
      unit: "%",
      icon: Gauge,
    },
    {
      label: "Operational Cost",
      value: compact(sum(chartData, (r) => r.totalOperationalCost)),
      unit: "$",
      unitLeading: true,
      icon: Wallet,
    },
    {
      label: "Avg. Vehicle ROI",
      value: decimal(mean(chartData, (r) => r.roi)),
      unit: "%",
      icon: Landmark,
      highlight: true,
    },
  ];

  const months = revenue.data ?? [];
  const maxRevenue = Math.max(0, ...months.map((m) => m.revenue));

  const costRows = costliest.data ?? [];
  const maxCost = Math.max(0, ...costRows.map((r) => r.totalOperationalCost));

  return (
    <>
      <PageHeader
        crumbs={["Reports", "Analytics"]}
        title="Analytics & Fleet Intelligence"
        subtitle="Operational performance and asset ROI across the active transit network."
        action={
          <div className="flex items-start gap-2">
            <div className="relative">
              <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                className="flex items-center gap-2 rounded-lg bg-surface-4 px-4 py-2 text-sm font-bold text-muted transition hover:bg-surface-4/80"
              >
                <Calendar className="size-4" strokeWidth={2} />
                {range}
                <ChevronDown className="size-3.5" strokeWidth={2.5} />
              </button>
              {open && (
                <ul className="glass-elevated absolute right-0 z-20 mt-2 w-44 overflow-hidden rounded-lg border border-line py-1">
                  {RANGES.map((r) => (
                    <li key={r}>
                      <button
                        type="button"
                        onClick={() => {
                          setRange(r);
                          setOpen(false);
                        }}
                        className={`w-full px-4 py-2 text-left text-sm transition hover:bg-accent/10 ${
                          r === range ? "text-accent" : "text-muted"
                        }`}
                      >
                        {r}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <Button
              className="rounded-lg px-4 py-2 text-sm"
              icon={<Download className="size-4" strokeWidth={2.5} />}
            >
              Export Report
            </Button>
          </div>
        }
      />

      {/* KPI cards */}
      {dashboard.isLoading ? (
        <div className="flex items-stretch gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 flex-1" />
          ))}
        </div>
      ) : dashboard.error ? (
        <ErrorState error={dashboard.error} onRetry={() => dashboard.refetch()} />
      ) : (
        <div className="flex items-stretch gap-4">
          {kpis.map((kpi) => (
            <KpiTile key={kpi.label} kpi={kpi} />
          ))}
        </div>
      )}

      {/* Bento: revenue chart + costliest vehicles */}
      <div className="grid grid-cols-12 gap-4">
        <Panel className="col-span-8 flex min-h-[400px] flex-col p-6">
          <div className="flex items-center justify-between pb-8">
            <div>
              <h2 className="text-xl font-semibold leading-7 text-ink">
                Monthly Revenue
              </h2>
              <p className="text-xs leading-4 text-muted">
                Annualized growth trajectory (USD)
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="size-3 rounded-sm bg-accent" />
              <span className="text-xs text-muted">Gross Revenue</span>
            </div>
          </div>

          {revenue.isLoading ? (
            <Skeleton className="flex-1" />
          ) : revenue.error ? (
            <ErrorState error={revenue.error} onRetry={() => revenue.refetch()} />
          ) : months.length === 0 ? (
            <EmptyState
              title="No revenue recorded yet"
              hint="Completed trips with revenue will chart here month by month."
            />
          ) : (
            <div className="flex flex-1 items-end gap-2 px-2">
              {months.map((m) => (
                <div
                  key={m.month}
                  className="flex flex-1 flex-col items-center justify-end gap-2"
                >
                  <div
                    className="w-full rounded-t-sm bg-gradient-to-t from-accent/30 to-accent"
                    style={{
                      height: `${
                        maxRevenue > 0 ? (m.revenue / maxRevenue) * 260 : 0
                      }px`,
                    }}
                    title={currency(m.revenue)}
                  />
                  <span className="text-center text-[10px] leading-5 text-muted">
                    {monthLabel(m.month)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Panel>

        <Panel className="col-span-4 flex flex-col p-6">
          <h2 className="text-xl font-semibold leading-7 text-ink">
            Top Costliest Vehicles
          </h2>
          <p className="pb-8 pt-1 text-xs leading-4 text-muted">
            Maintenance and fuel consumption leading indicators.
          </p>

          {costliest.isLoading ? (
            <div className="flex flex-1 flex-col gap-8">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-10" />
              ))}
            </div>
          ) : costliest.error ? (
            <ErrorState
              error={costliest.error}
              onRetry={() => costliest.refetch()}
            />
          ) : costRows.length === 0 ? (
            <EmptyState
              title="No operational costs yet"
              hint="Fuel and maintenance records will rank vehicles here."
            />
          ) : (
            <div className="flex flex-1 flex-col gap-8">
              {costRows.map((v, i) => {
                const tone = costTone(i);
                return (
                  <div key={v.id} className="flex flex-col gap-1">
                    <div className="flex items-start justify-between pb-1">
                      <span className="font-mono text-sm font-medium text-ink">
                        {v.registrationNumber}
                      </span>
                      <span
                        className={`font-mono text-sm font-bold ${tone.amount}`}
                      >
                        {currency(v.totalOperationalCost)}
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-surface-4">
                      <div
                        className={`h-full ${tone.bar}`}
                        style={{
                          width: `${
                            maxCost > 0
                              ? (v.totalOperationalCost / maxCost) * 100
                              : 0
                          }%`,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <button
            type="button"
            className="flex items-center justify-center gap-2 pt-6 text-sm font-bold text-accent transition hover:opacity-80"
          >
            View Full Fleet Audit
            <ArrowRight className="size-3.5" strokeWidth={2.5} />
          </button>
        </Panel>
      </div>

      {/* Settings & RBAC — no user/role endpoint on the API yet, so this stays mock. */}
      <Panel className="overflow-hidden">
        <div className="glass-elevated flex items-center justify-between border-b border-line px-6 py-5">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-semibold leading-7 text-ink">
                Settings & RBAC
              </h2>
              <MockBadge reason="No RBAC endpoint on the API yet" />
            </div>
            <p className="text-xs leading-4 text-muted">
              Role-Based Access Control matrix for system-wide transparency.
            </p>
          </div>
          <button
            type="button"
            className="rounded-lg border border-accent/20 bg-accent-dim px-4 py-2 text-sm font-bold text-accent transition hover:bg-accent/20"
          >
            Add New Role
          </button>
        </div>

        <Table>
          <thead>
            <tr>
              <Th>System Role</Th>
              <Th>Data Visibility</Th>
              <Th>Operational Control</Th>
              <Th>Financial Access</Th>
              <Th>User Status</Th>
            </tr>
          </thead>
          <tbody>
            {ROLES.map((r) => {
              const Icon = r.icon;
              return (
                <Tr key={r.role}>
                  <Td>
                    <div className="flex items-center gap-3">
                      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-line bg-surface-4/50">
                        <Icon className="size-4 text-muted" strokeWidth={2} />
                      </span>
                      <span className="text-sm font-bold text-ink">
                        {r.role}
                      </span>
                    </div>
                  </Td>
                  <Td className="text-sm text-ink">{r.visibility}</Td>
                  <Td
                    className={`text-sm ${r.controlMuted ? "text-muted" : "text-ink"}`}
                  >
                    {r.control}
                  </Td>
                  <Td
                    className={`text-sm ${r.financialMuted ? "text-muted" : "text-ink"}`}
                  >
                    {r.financial}
                  </Td>
                  <Td>
                    <RoleBadge admin={r.admin}>{r.status}</RoleBadge>
                  </Td>
                </Tr>
              );
            })}
          </tbody>
        </Table>
      </Panel>
    </>
  );
}

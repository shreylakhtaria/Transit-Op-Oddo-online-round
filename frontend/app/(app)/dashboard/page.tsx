"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import {
  Activity,
  CalendarClock,
  CircleAlert,
  CircleCheck,
  Info,
  List,
  Truck,
  TriangleAlert,
  User,
  Wrench,
  Zap,
} from "lucide-react";
import {
  Panel,
  StatusPill,
  Table,
  TableFooter,
  Td,
  Th,
  Tr,
  type Tone,
} from "@/components/ui";
import {
  EmptyState,
  ErrorState,
  MockBadge,
  Skeleton,
  TableSkeleton,
} from "@/components/ui/async";
import { useDashboard } from "@/lib/api/hooks";
import type { Trip, TripStatus } from "@/lib/api/types";

/* Warning hue (Maintenance stat, In Shop meter, Route Delay alert) now comes from
   the shared `warn` token rather than a local amber literal. */
const WARN_TEXT = "text-warn";
const WARN_BAR = "bg-warn";

/* ---------------------------------------------------------------- data ---- */

/** The design pads single-digit counts ("05", "09"); thousands get separators. */
const stat = (n: number) =>
  n < 10 ? `0${n}` : n.toLocaleString();

const TRIP_TONE: Record<TripStatus, Tone> = {
  Draft: "neutral",
  Dispatched: "warn",
  Completed: "success",
  Cancelled: "danger",
};

const initialsOf = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("") || "—";

/* ------------------------------------------------------------- pieces ---- */

function StatTile({
  label,
  value,
  unit,
  icon,
  valueClass = "text-ink",
  highlight = false,
}: {
  label: string;
  value: string;
  unit: string;
  icon: ReactNode;
  valueClass?: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`glass flex flex-col gap-2 rounded-xl px-4 py-4 ${
        highlight ? "border-accent/40!" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="label-eyebrow">{label}</span>
        {icon}
      </div>
      <p className="flex items-baseline gap-1.5">
        <span className={`font-mono text-3xl font-bold leading-8 ${valueClass}`}>
          {value}
        </span>
        <span className="text-[10px] font-bold text-muted">{unit}</span>
      </p>
    </div>
  );
}

function Meter({
  label,
  pct,
  bar,
  text,
}: {
  label: string;
  pct: number;
  bar: string;
  text: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="label-eyebrow">{label}</span>
        <span className={`font-mono text-[11px] font-bold ${text}`}>
          {pct}%
        </span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-3">
        <div
          className={`h-full rounded-full ${bar}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

/** Circular "Fleet Health Index" gauge — plain inline SVG, no chart lib. */
function HealthGauge({ pct }: { pct: number }) {
  const r = 26;
  const circumference = 2 * Math.PI * r;
  return (
    <div className="relative flex size-14 shrink-0 items-center justify-center">
      <svg viewBox="0 0 60 60" className="size-14 -rotate-90">
        <circle
          cx="30"
          cy="30"
          r={r}
          fill="none"
          strokeWidth="3"
          className="stroke-surface-3"
        />
        <circle
          cx="30"
          cy="30"
          r={r}
          fill="none"
          strokeWidth="3"
          strokeLinecap="round"
          className="stroke-accent"
          strokeDasharray={`${(pct / 100) * circumference} ${circumference}`}
        />
      </svg>
      <span className="absolute font-mono text-[11px] font-bold text-accent">
        {pct}%
      </span>
    </div>
  );
}

function Alert({
  icon,
  title,
  body,
  className,
}: {
  icon: ReactNode;
  title: string;
  body: string;
  className: string;
}) {
  return (
    <div
      className={`flex gap-3 rounded border-l-2 px-4 py-3 backdrop-blur-[24px] ${className}`}
    >
      <span className="pt-0.5">{icon}</span>
      <div className="flex flex-col gap-1">
        <p className="text-[13px] font-bold text-ink">{title}</p>
        <p className="text-xs leading-4 text-muted">{body}</p>
      </div>
    </div>
  );
}

function TripRow({ trip }: { trip: Trip }) {
  const vehicle =
    trip.vehicle?.registrationNumber ?? trip.vehicle?.model ?? "—";
  const driver = trip.driver?.name;

  return (
    <Tr>
      <Td mono className="text-[13px] text-accent">
        TR{String(trip.id).padStart(3, "0")}
      </Td>
      <Td>
        <span className="flex items-center gap-2">
          <Truck className="size-3.5 shrink-0 text-muted" />
          <span className="text-ink">{vehicle}</span>
        </span>
      </Td>
      <Td>
        {driver ? (
          <span className="flex items-center gap-2">
            <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-surface-4 text-[10px] font-bold text-muted">
              {initialsOf(driver)}
            </span>
            <span className="text-ink">{driver}</span>
          </span>
        ) : (
          <span className="text-muted">—</span>
        )}
      </Td>
      <Td>
        <StatusPill tone={TRIP_TONE[trip.status]}>
          <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.5px]">
            {trip.status === "Dispatched" && (
              <span className="size-1.5 rounded-full bg-accent" />
            )}
            {trip.status}
          </span>
        </StatusPill>
      </Td>
      {/* The API exposes no ETA for a trip — no arrival estimate to show. */}
      <Td align="right">
        <span className="text-muted">—</span>
      </Td>
    </Tr>
  );
}

/* --------------------------------------------------------------- page ---- */

export default function DashboardPage() {
  const { data, isLoading, error, refetch } = useDashboard();

  const kpis = data?.kpis;
  const trips = data?.recentTrips ?? [];

  /* Fleet Distribution is derived from the vehicle KPIs: `activeVehicles` is the
     non-retired fleet, so On Trip is whatever is neither available nor in the shop.
     There is no retired count in the payload, so that slice is omitted rather than faked. */
  const fleetTotal = kpis?.activeVehicles ?? 0;
  const onTrip = kpis
    ? Math.max(
        0,
        kpis.activeVehicles - kpis.availableVehicles - kpis.vehiclesInMaintenance,
      )
    : 0;
  const share = (n: number) =>
    fleetTotal > 0 ? Math.round((n / fleetTotal) * 100) : 0;

  const distribution = kpis
    ? [
        {
          label: "Available",
          pct: share(kpis.availableVehicles),
          bar: "bg-success",
          text: "text-success",
        },
        {
          label: "On Trip",
          pct: share(onTrip),
          bar: "bg-accent",
          text: "text-accent",
        },
        {
          label: "In Shop",
          pct: share(kpis.vehiclesInMaintenance),
          bar: WARN_BAR,
          text: WARN_TEXT,
        },
      ]
    : [];

  const utilization = Math.round(kpis?.fleetUtilization ?? 0);

  if (error) {
    return (
      <>
        <ErrorState error={error} onRetry={() => void refetch()} />
      </>
    );
  }

  return (
    <>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4 xl:grid-cols-7">
        {isLoading || !kpis ? (
          Array.from({ length: 7 }).map((_, i) => (
            <Skeleton
              key={i}
              className={`h-24 ${i === 6 ? "col-span-2 md:col-span-1" : ""}`}
            />
          ))
        ) : (
          <>
            <StatTile
              label="Active"
              value={stat(kpis.activeVehicles)}
              unit="Units"
              icon={<Zap className="size-3.5 text-accent" />}
            />
            <StatTile
              label="Available"
              value={stat(kpis.availableVehicles)}
              unit="Units"
              valueClass="text-success"
              icon={<CircleCheck className="size-3.5 text-success" />}
            />
            <StatTile
              label="Maintenance"
              value={stat(kpis.vehiclesInMaintenance)}
              unit="Units"
              valueClass={WARN_TEXT}
              icon={<Wrench className={`size-3.5 ${WARN_TEXT}`} />}
            />
            <StatTile
              label="Active Trips"
              value={stat(kpis.activeTrips)}
              unit="Live"
              highlight
              icon={<Activity className="size-3.5 text-accent" />}
            />
            <StatTile
              label="Pending"
              value={stat(kpis.pendingTrips)}
              unit="Queued"
              icon={<CalendarClock className="size-3.5 text-muted" />}
            />
            <StatTile
              label="Drivers"
              value={stat(kpis.driversOnDuty)}
              unit="On Duty"
              icon={<User className="size-3.5 text-muted" />}
            />
            <div className="glass col-span-2 flex flex-col justify-center gap-2 rounded-xl border-accent/40! px-4 py-4 md:col-span-1">
              <div className="flex items-center justify-between gap-2">
                <span className="label-eyebrow">Utilization</span>
                <span className="font-mono text-[11px] font-bold text-accent">
                  {utilization}%
                </span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-3">
                <div
                  className="h-full rounded-full bg-accent"
                  style={{ width: `${utilization}%` }}
                />
              </div>
            </div>
          </>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <section className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <List className="size-4 text-accent" />
              <h2 className="text-xl font-bold text-ink">Recent Trips</h2>
            </div>
            <Link
              href="/trips"
              className="text-sm font-bold text-accent transition hover:opacity-80"
            >
              View Full Log
            </Link>
          </div>

          <Panel className="overflow-hidden">
            {isLoading ? (
              <TableSkeleton cols={5} />
            ) : (
              <>
                <Table>
                  <thead>
                    <tr>
                      <Th>Trip ID</Th>
                      <Th>Vehicle</Th>
                      <Th>Driver</Th>
                      <Th>Status</Th>
                      <Th align="right">ETA</Th>
                    </tr>
                  </thead>
                  {trips.length > 0 && (
                    <tbody>
                      {trips.map((t) => (
                        <TripRow key={t.id} trip={t} />
                      ))}
                    </tbody>
                  )}
                </Table>
                {trips.length > 0 ? (
                  <TableFooter
                    summary={`Showing ${trips.length} of ${trips.length} trips`}
                  />
                ) : (
                  <EmptyState
                    title="No trips yet"
                    hint="Dispatch a trip and it will show up here."
                  />
                )}
              </>
            )}
          </Panel>
        </section>

        <aside className="flex flex-col gap-6">
          <Panel className="p-6">
            <div className="flex items-center justify-between pb-5">
              <h2 className="text-lg font-bold text-ink">Fleet Distribution</h2>
              <Info className="size-4 text-placeholder" />
            </div>

            {isLoading ? (
              <div className="flex flex-col gap-4">
                <Skeleton className="h-8" />
                <Skeleton className="h-8" />
                <Skeleton className="h-8" />
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {distribution.map((d) => (
                  <Meter key={d.label} {...d} />
                ))}
              </div>
            )}

            {/* No fleet-health endpoint exists — the index and gauge stay on mock values. */}
            <div className="mt-6 flex items-center justify-between border-t border-line-soft pt-5">
              <div className="flex flex-col gap-1">
                <span className="label-eyebrow">Fleet Health Index</span>
                <p className="flex items-baseline gap-2">
                  <span className="font-mono text-2xl font-bold text-ink">
                    94.2
                  </span>
                  <span className="text-[11px] font-bold text-success">
                    Optimal
                  </span>
                  <MockBadge reason="No fleet-health endpoint on the TransitOps API." />
                </p>
              </div>
              <HealthGauge pct={94} />
            </div>
          </Panel>

          <Panel className="p-6">
            <div className="flex items-center justify-between pb-4">
              <h2 className="label-field uppercase tracking-[1px] text-ink">
                Critical Alerts
              </h2>
              <span className="flex items-center gap-2">
                <MockBadge reason="No alerts endpoint on the TransitOps API." />
                <span className="rounded bg-danger-dim px-2 py-0.5 font-mono text-[10px] font-bold text-danger">
                  02
                </span>
              </span>
            </div>

            <div className="flex flex-col gap-3">
              <Alert
                icon={<CircleAlert className="size-4 text-danger" />}
                title="Engine Fault: VN-882"
                body="Coolant temperature critical. Driver notified."
                className="border-danger bg-danger-dim"
              />
              <Alert
                icon={<TriangleAlert className={`size-4 ${WARN_TEXT}`} />}
                title="Route Delay: TR001"
                body="Heavy traffic on Interstate 40. +22 mins ETA."
                className="border-warn bg-warn-dim"
              />
            </div>
          </Panel>
        </aside>
      </div>
    </>
  );
}

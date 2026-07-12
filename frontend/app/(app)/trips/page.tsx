"use client";

import { ArrowRight, Info, Route } from "lucide-react";
import {
  Panel,
  PageHeader,
  RuleNote,
  StatusPill,
  Table,
  TableFooter,
  Td,
  Th,
  Tr,
  type Tone,
} from "@/components/ui";
import { EmptyState, ErrorState, TableSkeleton } from "@/components/ui/async";
import { useTrips } from "@/lib/api/hooks";
import type { TripStatus } from "@/lib/api/types";

const TRIP_TONE: Record<TripStatus, Tone> = {
  Completed: "success",
  "In Progress": "warn",
  Dispatched: "warn",
  Cancelled: "danger",
  Draft: "neutral",
};

export default function TripsPage() {
  const { data, isLoading, error, refetch } = useTrips();
  const trips = data ?? [];

  return (
    <>
      <PageHeader
        crumbs={["Fleet", "Trips"]}
        title="Trip Dispatcher"
        subtitle="Plan, assign and monitor active transportation jobs."
      />

      <Panel className="overflow-hidden">
        {isLoading ? (
          <TableSkeleton rows={5} cols={5} />
        ) : error ? (
          <ErrorState error={error} onRetry={() => refetch()} />
        ) : trips.length === 0 ? (
          <EmptyState
            title="No trips yet"
            hint="Dispatched jobs will appear here once a trip is created against a vehicle and driver."
            icon={<Route className="size-7 text-muted" />}
          />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Trip ID</Th>
                <Th>Route</Th>
                <Th>Vehicle</Th>
                <Th>Driver</Th>
                <Th>Status</Th>
              </tr>
            </thead>
            <tbody>
              {trips.map((trip) => (
                <Tr key={trip.id}>
                  <Td mono className="text-[13px] text-accent">
                    TRP-{String(trip.id).padStart(4, "0")}
                  </Td>
                  <Td>
                    <span className="flex items-center gap-2">
                      <span className="text-ink">{trip.source}</span>
                      <ArrowRight className="size-3.5 shrink-0 text-muted" />
                      <span className="text-ink">{trip.destination}</span>
                    </span>
                  </Td>
                  <Td mono className="text-[13px]">
                    {trip.vehicle?.registrationNumber ?? (
                      <span className="font-sans text-muted">Unassigned</span>
                    )}
                  </Td>
                  <Td className="text-muted">
                    {trip.driver?.name ?? "Unassigned"}
                  </Td>
                  <Td>
                    <StatusPill tone={TRIP_TONE[trip.status] ?? "neutral"}>
                      {trip.status}
                    </StatusPill>
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        )}

        <TableFooter
          summary={`${trips.length} ${trips.length === 1 ? "trip" : "trips"}`}
          pages={1}
        />
      </Panel>

      <RuleNote icon={<Info className="size-4 shrink-0 text-muted" />}>
        <span className="font-bold text-ink">Dispatch Policy:</span> A trip needs
        an available vehicle and driver before it leaves Draft{" "}
        <span className="text-line">•</span> Retired/In Maintenance vehicles are
        excluded from dispatch.
      </RuleNote>
    </>
  );
}

"use client";

import { useMemo, useState } from "react";
import { ArrowRight, Info, Route, Plus, Check } from "lucide-react";
import {
  Button,
  Field,
  Input,
  Panel,
  PageHeader,
  RuleNote,
  StatusPill,
  Table,
  TableFooter,
  Td,
  Th,
  Tr,
  Select,
  type Tone,
} from "@/components/ui";
import { EmptyState, ErrorState, TableSkeleton } from "@/components/ui/async";
import {
  useTrips,
  useVehicles,
  useDrivers,
  useCreateTrip,
  useDispatchTrip,
  useCompleteTrip,
  useCancelTrip,
} from "@/lib/api/hooks";
import type { TripStatus } from "@/lib/api/types";
import { useAuth } from "@/lib/auth";

const TRIP_TONE: Record<TripStatus, Tone> = {
  Completed: "success",
  Dispatched: "warn",
  Cancelled: "danger",
  Draft: "neutral",
};

export default function TripsPage() {
  const { user } = useAuth();
  const { data, isLoading, error, refetch } = useTrips();
  const { data: vehiclesData } = useVehicles();
  const { data: driversData } = useDrivers();

  const isAllowed = user?.role?.name === "Fleet Manager" || user?.role?.name === "Driver";

  const createTrip = useCreateTrip();
  const dispatchTrip = useDispatchTrip();
  const completeTrip = useCompleteTrip();
  const cancelTrip = useCancelTrip();

  const trips = data ?? [];

  // Create Trip Form States
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [source, setSource] = useState("");
  const [destination, setDestination] = useState("");
  const [vehicleId, setVehicleId] = useState("");
  const [driverId, setDriverId] = useState("");
  const [cargoWeight, setCargoWeight] = useState("");
  const [plannedDistance, setPlannedDistance] = useState("");
  const [createError, setCreateError] = useState("");

  // Complete Trip Modal States
  const [activeCompleteTripId, setActiveCompleteTripId] = useState<number | null>(null);
  const [actualDistance, setActualDistance] = useState("");
  const [fuelConsumed, setFuelConsumed] = useState("");
  const [fuelCost, setFuelCost] = useState("");
  const [revenue, setRevenue] = useState("");
  const [completeError, setCompleteError] = useState("");

  // Filter available assets for dispatch
  const availableVehicles = useMemo(() =>
    (vehiclesData ?? []).filter((v) => v.status === "Available"),
    [vehiclesData]
  );

  const availableDrivers = useMemo(() =>
    (driversData ?? []).filter((d) => d.status === "Available"),
    [driversData]
  );

  const resetCreateForm = () => {
    setSource("");
    setDestination("");
    setVehicleId("");
    setDriverId("");
    setCargoWeight("");
    setPlannedDistance("");
    setCreateError("");
  };

  const handleCreateTrip = (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError("");
    if (!vehicleId || !driverId) {
      setCreateError("Please select a vehicle and a driver.");
      return;
    }
    createTrip.mutate({
      source,
      destination,
      vehicleId: Number(vehicleId),
      driverId: Number(driverId),
      cargoWeight: Number(cargoWeight),
      plannedDistance: Number(plannedDistance),
    }, {
      onSuccess: () => {
        resetCreateForm();
        setIsCreateOpen(false);
      },
      onError: (err) => {
        setCreateError(err instanceof Error ? err.message : "Failed to create trip");
      }
    });
  };

  const handleCompleteTrip = (e: React.FormEvent) => {
    e.preventDefault();
    setCompleteError("");
    if (activeCompleteTripId === null) return;
    completeTrip.mutate({
      id: activeCompleteTripId,
      actualDistance: Number(actualDistance),
      fuelConsumed: Number(fuelConsumed),
      fuelCost: fuelCost ? Number(fuelCost) : undefined,
      revenue: Number(revenue),
    }, {
      onSuccess: () => {
        setActiveCompleteTripId(null);
        setActualDistance("");
        setFuelConsumed("");
        setFuelCost("");
        setRevenue("");
      },
      onError: (err) => {
        setCompleteError(err instanceof Error ? err.message : "Failed to complete trip");
      }
    });
  };

  return (
    <>
      <PageHeader
        crumbs={["Fleet", "Trips"]}
        title="Trip Dispatcher"
        subtitle="Plan, assign and monitor active transportation jobs."
        action={
          isAllowed ? (
            <Button
              icon={<Plus className="size-3.5" strokeWidth={3} />}
              onClick={() => setIsCreateOpen(true)}
            >
              Create Trip
            </Button>
          ) : undefined
        }
      />

      <Panel className="overflow-hidden">
        {isLoading ? (
          <TableSkeleton rows={5} cols={6} />
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
                {isAllowed && <Th align="right">Actions</Th>}
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
                  {isAllowed && (
                    <Td align="right">
                      <div className="flex justify-end gap-2">
                        {trip.status === "Draft" && (
                          <Button
                            variant="primary"
                            className="px-3 py-1 text-xs"
                            onClick={() => dispatchTrip.mutate(trip.id)}
                            disabled={dispatchTrip.isPending}
                          >
                            {dispatchTrip.isPending && dispatchTrip.variables === trip.id ? "..." : "Dispatch"}
                          </Button>
                        )}
                        {trip.status === "Dispatched" && (
                          <>
                            <Button
                              variant="primary"
                              className="px-3 py-1 text-xs"
                              onClick={() => setActiveCompleteTripId(trip.id)}
                            >
                              Complete
                            </Button>
                            <Button
                              variant="outline"
                              className="px-3 py-1 text-xs border-danger/30 text-danger hover:bg-danger/10"
                              onClick={() => cancelTrip.mutate(trip.id)}
                              disabled={cancelTrip.isPending}
                            >
                              {cancelTrip.isPending && cancelTrip.variables === trip.id ? "..." : "Cancel"}
                            </Button>
                          </>
                        )}
                      </div>
                    </Td>
                  )}
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

      {/* Create Trip Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="glass w-full max-w-md p-6 rounded-xl flex flex-col gap-6 shadow-[0_0_50px_rgba(0,0,0,0.8)] border border-line">
            <h2 className="text-xl font-bold text-ink">Create New Trip</h2>
            <form onSubmit={handleCreateTrip} className="flex flex-col gap-4">
              <div className="flex gap-4">
                <Field label="Source" className="flex-1">
                  <Input required placeholder="Mumbai" value={source} onChange={e => setSource(e.target.value)} />
                </Field>
                <Field label="Destination" className="flex-1">
                  <Input required placeholder="Pune" value={destination} onChange={e => setDestination(e.target.value)} />
                </Field>
              </div>

              <Field label="Assign Vehicle">
                <Select
                  options={["Select a vehicle", ...availableVehicles.map(v => `${v.id} · ${v.registrationNumber} (${v.model})`)]}
                  value={vehicleId ? [...availableVehicles.map(v => `${v.id} · ${v.registrationNumber} (${v.model})`)].find(opt => opt.startsWith(vehicleId)) : "Select a vehicle"}
                  onChange={e => setVehicleId(e.target.value.split(" · ")[0])}
                />
              </Field>

              <Field label="Assign Driver">
                <Select
                  options={["Select a driver", ...availableDrivers.map(d => `${d.id} · ${d.name} (${d.licenseNumber})`)]}
                  value={driverId ? [...availableDrivers.map(d => `${d.id} · ${d.name} (${d.licenseNumber})`)].find(opt => opt.startsWith(driverId)) : "Select a driver"}
                  onChange={e => setDriverId(e.target.value.split(" · ")[0])}
                />
              </Field>

              <div className="flex gap-4">
                <Field label="Cargo Weight (kg)" className="flex-1">
                  <Input required type="number" min="1" placeholder="1500" value={cargoWeight} onChange={e => setCargoWeight(e.target.value)} />
                </Field>
                <Field label="Planned Distance (km)" className="flex-1">
                  <Input required type="number" min="1" placeholder="150" value={plannedDistance} onChange={e => setPlannedDistance(e.target.value)} />
                </Field>
              </div>

              {createError && <p className="text-sm text-danger">{createError}</p>}

              <div className="flex gap-3 pt-2">
                <Button type="submit" className="flex-1 justify-center py-3 text-sm" disabled={createTrip.isPending}>
                  {createTrip.isPending ? "Creating..." : "Create Trip"}
                </Button>
                <Button variant="outline" className="flex-1 justify-center py-3 text-sm" onClick={() => { resetCreateForm(); setIsCreateOpen(false); }}>
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Complete Trip Modal */}
      {activeCompleteTripId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="glass w-full max-w-md p-6 rounded-xl flex flex-col gap-6 shadow-[0_0_50px_rgba(0,0,0,0.8)] border border-line">
            <h2 className="text-xl font-bold text-ink">Complete Trip Record</h2>
            <form onSubmit={handleCompleteTrip} className="flex flex-col gap-4">
              <div className="flex gap-4">
                <Field label="Actual Distance (km)" className="flex-1">
                  <Input required type="number" min="1" placeholder="160" value={actualDistance} onChange={e => setActualDistance(e.target.value)} />
                </Field>
                <Field label="Fuel Consumed (L)" className="flex-1">
                  <Input required type="number" min="1" placeholder="25" value={fuelConsumed} onChange={e => setFuelConsumed(e.target.value)} />
                </Field>
              </div>

              <div className="flex gap-4">
                <Field label="Fuel Cost (INR - optional)" className="flex-1">
                  <Input type="number" min="1" placeholder="40" value={fuelCost} onChange={e => setFuelCost(e.target.value)} />
                </Field>
                <Field label="Revenue Generated (INR)" className="flex-1">
                  <Input required type="number" min="1" placeholder="450" value={revenue} onChange={e => setRevenue(e.target.value)} />
                </Field>
              </div>

              {completeError && <p className="text-sm text-danger">{completeError}</p>}

              <div className="flex gap-3 pt-2">
                <Button type="submit" className="flex-1 justify-center py-3 text-sm" disabled={completeTrip.isPending}>
                  {completeTrip.isPending ? "Completing..." : "Complete Trip"}
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 justify-center py-3 text-sm"
                  onClick={() => {
                    setActiveCompleteTripId(null);
                    setCompleteError("");
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

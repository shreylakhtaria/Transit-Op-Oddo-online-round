"use client";

import { useMemo, useState, type FormEvent, type ReactNode } from "react";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Info,
  Loader2,
  Plus,
  Route,
} from "lucide-react";
import {
  Button,
  Field,
  Input,
  Panel,
  PageHeader,
  RuleNote,
  Select,
  StatusPill,
  Table,
  TableFooter,
  Td,
  Th,
  Tr,
  type Tone,
} from "@/components/ui";
import { EmptyState, ErrorState, TableSkeleton } from "@/components/ui/async";
import { Modal, ModalActions } from "@/components/ui/modal";
import {
  useCancelTrip,
  useCompleteTrip,
  useCreateTrip,
  useDispatchTrip,
  useDispatchableAssets,
  useTrips,
} from "@/lib/api/hooks";
import type { CompleteTripBody, Trip, TripStatus } from "@/lib/api/types";

const TRIP_TONE: Record<TripStatus, Tone> = {
  Completed: "success",
  Dispatched: "warn",
  Cancelled: "danger",
  Draft: "neutral",
};

const code = (id: number) => `TRP-${String(id).padStart(4, "0")}`;

const PICK_VEHICLE = "Select a vehicle";
const PICK_DRIVER = "Select a driver";

/** The <Select> primitive keys options by their own text, so the id rides in the label. */
const labelFor = (map: Map<string, string>, id: string, fallback: string) =>
  [...map.entries()].find(([, value]) => value === id)?.[0] ?? fallback;

const message = (error: unknown, fallback: string) =>
  error instanceof Error ? error.message : fallback;

/** Compact row action — same glass idiom as the icon buttons on Maintenance. */
function RowAction({
  children,
  onClick,
  pending = false,
  disabled = false,
  danger = false,
}: {
  children: ReactNode;
  onClick: () => void;
  pending?: boolean;
  disabled?: boolean;
  danger?: boolean;
}) {
  const hover = danger
    ? "hover:border-danger/40 hover:bg-danger-dim hover:text-danger"
    : "hover:border-accent/40 hover:bg-accent/15 hover:text-accent";
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending || disabled}
      className={`flex items-center gap-1 whitespace-nowrap rounded border border-line bg-accent-faint px-2 py-1 text-xs font-bold text-muted transition disabled:cursor-not-allowed disabled:opacity-40 ${hover}`}
    >
      {pending && <Loader2 className="size-3 animate-spin" />}
      {children}
    </button>
  );
}

/** Stands in for a dropdown when the API has nothing eligible to put in it. */
function ModalNote({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-lg border border-line bg-accent-faint px-3 py-2 text-sm text-muted">
      {children}
    </p>
  );
}

export default function TripsPage() {
  const { data, isLoading, error, refetch } = useTrips();
  // Only vehicles/drivers the API will actually accept — the full lists include
  // assets that are In Shop / On Trip / Suspended, which POST /trips rejects.
  const assets = useDispatchableAssets();

  const createTrip = useCreateTrip();
  const dispatchTrip = useDispatchTrip();
  const completeTrip = useCompleteTrip();
  const cancelTrip = useCancelTrip();

  const [newOpen, setNewOpen] = useState(false);
  const [completeFor, setCompleteFor] = useState<Trip | null>(null);
  const [cancelFor, setCancelFor] = useState<Trip | null>(null);

  // New-trip form
  const [source, setSource] = useState("");
  const [destination, setDestination] = useState("");
  const [vehicleId, setVehicleId] = useState("");
  const [driverId, setDriverId] = useState("");
  const [cargoWeight, setCargoWeight] = useState("");
  const [plannedDistance, setPlannedDistance] = useState("");

  // Complete-trip form
  const [actualDistance, setActualDistance] = useState("");
  const [fuelConsumed, setFuelConsumed] = useState("");
  const [fuelCost, setFuelCost] = useState("");
  const [revenue, setRevenue] = useState("");

  const trips = data ?? [];

  const vehicleLabels = useMemo(
    () =>
      new Map(
        (assets.data?.vehicles ?? []).map((v) => [
          `${v.registrationNumber} · ${v.model} (${v.maxLoadCapacity.toLocaleString()} kg)`,
          String(v.id),
        ]),
      ),
    [assets.data],
  );

  const driverLabels = useMemo(
    () =>
      new Map(
        (assets.data?.drivers ?? []).map((d) => [
          `${d.name} · ${d.licenseNumber}`,
          String(d.id),
        ]),
      ),
    [assets.data],
  );

  // Only claim "nothing available" once the endpoint has actually answered.
  const noVehicles = Boolean(assets.data) && vehicleLabels.size === 0;
  const noDrivers = Boolean(assets.data) && driverLabels.size === 0;

  const createValid =
    source.trim() !== "" &&
    destination.trim() !== "" &&
    vehicleId !== "" &&
    driverId !== "" &&
    Number(cargoWeight) > 0 &&
    Number(plannedDistance) > 0;

  const completeValid =
    Number(actualDistance) > 0 &&
    Number(fuelConsumed) > 0 &&
    revenue !== "" &&
    Number(revenue) >= 0 &&
    (fuelCost === "" || Number(fuelCost) > 0);

  function openNewTrip() {
    createTrip.reset();
    setSource("");
    setDestination("");
    setVehicleId("");
    setDriverId("");
    setCargoWeight("");
    setPlannedDistance("");
    setNewOpen(true);
  }

  function submitNewTrip(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!createValid) return;
    // The API's Zod validator rejects strings — every number goes over as a number.
    createTrip.mutate(
      {
        source: source.trim(),
        destination: destination.trim(),
        vehicleId: Number(vehicleId),
        driverId: Number(driverId),
        cargoWeight: Number(cargoWeight),
        plannedDistance: Number(plannedDistance),
      },
      { onSuccess: () => setNewOpen(false) },
    );
  }

  function openComplete(trip: Trip) {
    completeTrip.reset();
    setActualDistance(
      trip.plannedDistance != null ? String(trip.plannedDistance) : "",
    );
    setFuelConsumed("");
    setFuelCost("");
    setRevenue("");
    setCompleteFor(trip);
  }

  function submitComplete(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!completeFor || !completeValid) return;
    const body: CompleteTripBody = {
      actualDistance: Number(actualDistance),
      fuelConsumed: Number(fuelConsumed),
      revenue: Number(revenue),
    };
    // fuelCost is optional — only send it when the dispatcher filled it in.
    if (fuelCost !== "") body.fuelCost = Number(fuelCost);
    completeTrip.mutate(
      { id: completeFor.id, ...body },
      { onSuccess: () => setCompleteFor(null) },
    );
  }

  function openCancel(trip: Trip) {
    cancelTrip.reset();
    setCancelFor(trip);
  }

  function submitCancel(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!cancelFor) return;
    cancelTrip.mutate(cancelFor.id, { onSuccess: () => setCancelFor(null) });
  }

  const dispatchingId = dispatchTrip.isPending ? dispatchTrip.variables : null;

  return (
    <>
      <PageHeader
        crumbs={["Fleet", "Trips"]}
        title="Trip Dispatcher"
        subtitle="Plan, assign and monitor active transportation jobs."
        action={
          <Button
            icon={<Plus className="size-3.5" strokeWidth={3} />}
            onClick={openNewTrip}
          >
            New Trip
          </Button>
        }
      />

      {/* Dispatch fires straight from the row, so its failure needs a home on the page. */}
      {dispatchTrip.isError && (
        <p
          role="alert"
          className="rounded-lg border border-danger/30 bg-danger-dim px-3 py-2 text-sm text-danger"
        >
          <span className="font-bold">
            Couldn&apos;t dispatch{" "}
            {dispatchTrip.variables != null
              ? code(dispatchTrip.variables)
              : "the trip"}{" "}
            —{" "}
          </span>
          {message(dispatchTrip.error, "The API rejected the dispatch.")}
        </p>
      )}

      <Panel className="overflow-hidden">
        {isLoading ? (
          <TableSkeleton rows={5} cols={8} />
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
                <Th className="px-2 whitespace-nowrap">Trip ID</Th>
                <Th className="px-2 whitespace-nowrap">Route</Th>
                <Th className="px-2 whitespace-nowrap">Vehicle</Th>
                <Th className="px-2 whitespace-nowrap">Driver</Th>
                <Th align="right" className="px-2 whitespace-nowrap">
                  Cargo
                </Th>
                <Th align="right" className="px-2 whitespace-nowrap">
                  Distance
                </Th>
                <Th className="px-2 whitespace-nowrap">Status</Th>
                <Th align="right" className="px-2 whitespace-nowrap">
                  Actions
                </Th>
              </tr>
            </thead>
            <tbody>
              {trips.map((trip) => {
                const isDraft = trip.status === "Draft";
                const isDispatched = trip.status === "Dispatched";
                // Once a trip is closed out the actual run is the truth; until then, the plan is.
                const distance = trip.actualDistance ?? trip.plannedDistance;

                return (
                  <Tr key={trip.id}>
                    <Td
                      mono
                      className="px-2 whitespace-nowrap text-[13px] text-accent"
                    >
                      {code(trip.id)}
                    </Td>
                    <Td className="px-2 whitespace-nowrap text-sm">
                      <span className="flex items-center gap-2">
                        <span className="text-ink">{trip.source}</span>
                        <ArrowRight className="size-3.5 shrink-0 text-muted" />
                        <span className="text-ink">{trip.destination}</span>
                      </span>
                    </Td>
                    <Td mono className="px-2 whitespace-nowrap text-[13px]">
                      {trip.vehicle?.registrationNumber ?? (
                        <span className="font-sans text-muted">Unassigned</span>
                      )}
                    </Td>
                    <Td className="px-2 whitespace-nowrap text-sm text-muted">
                      {trip.driver?.name ?? "Unassigned"}
                    </Td>
                    <Td
                      align="right"
                      mono
                      className="px-2 whitespace-nowrap text-[13px]"
                    >
                      {trip.cargoWeight != null ? (
                        `${trip.cargoWeight.toLocaleString()} kg`
                      ) : (
                        <span className="font-sans text-muted">—</span>
                      )}
                    </Td>
                    <Td
                      align="right"
                      mono
                      className="px-2 whitespace-nowrap text-[13px]"
                    >
                      {distance != null ? (
                        <span
                          title={
                            trip.actualDistance != null
                              ? `Actual · planned ${
                                  trip.plannedDistance?.toLocaleString() ?? "—"
                                } km`
                              : "Planned"
                          }
                        >
                          {distance.toLocaleString()} km
                        </span>
                      ) : (
                        <span className="font-sans text-muted">—</span>
                      )}
                    </Td>
                    <Td className="px-2">
                      <StatusPill tone={TRIP_TONE[trip.status] ?? "neutral"}>
                        {trip.status}
                      </StatusPill>
                    </Td>
                    <Td className="px-2">
                      <div className="flex items-center justify-end gap-1.5">
                        {isDraft && (
                          <RowAction
                            onClick={() => dispatchTrip.mutate(trip.id)}
                            pending={dispatchingId === trip.id}
                            disabled={dispatchTrip.isPending}
                          >
                            Dispatch
                          </RowAction>
                        )}
                        {isDispatched && (
                          <RowAction onClick={() => openComplete(trip)}>
                            Complete
                          </RowAction>
                        )}
                        {(isDraft || isDispatched) && (
                          <RowAction danger onClick={() => openCancel(trip)}>
                            Cancel
                          </RowAction>
                        )}
                        {!isDraft && !isDispatched && (
                          <span className="text-xs text-muted">—</span>
                        )}
                      </div>
                    </Td>
                  </Tr>
                );
              })}
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

      <Modal
        open={newOpen}
        onClose={() => setNewOpen(false)}
        title="New Trip"
        subtitle="Draft a job against a vehicle and driver that are free right now."
        icon={<Route className="size-5" />}
      >
        <form className="flex flex-col gap-5" onSubmit={submitNewTrip}>
          <div className="flex gap-4">
            <Field label="Source" className="flex-1">
              <Input
                placeholder="Ahmedabad"
                value={source}
                onChange={(e) => setSource(e.target.value)}
                required
              />
            </Field>
            <Field label="Destination" className="flex-1">
              <Input
                placeholder="Surat"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                required
              />
            </Field>
          </div>

          {assets.isLoading && (
            <p className="flex items-center gap-2 text-sm text-muted">
              <Loader2 className="size-4 animate-spin" />
              Loading available vehicles and drivers…
            </p>
          )}

          {assets.error && (
            <p className="rounded-lg border border-danger/30 bg-danger-dim px-3 py-2 text-sm text-danger">
              {message(
                assets.error,
                "Couldn't load the dispatchable vehicles and drivers.",
              )}
            </p>
          )}

          <Field label="Vehicle">
            {noVehicles ? (
              <ModalNote>
                No available vehicles — all are on trips or in the shop.
              </ModalNote>
            ) : (
              <Select
                options={[PICK_VEHICLE, ...vehicleLabels.keys()]}
                value={labelFor(vehicleLabels, vehicleId, PICK_VEHICLE)}
                onChange={(e) =>
                  setVehicleId(vehicleLabels.get(e.target.value) ?? "")
                }
                disabled={assets.isLoading}
                className="font-mono"
              />
            )}
          </Field>

          <Field label="Driver">
            {noDrivers ? (
              <ModalNote>
                No available drivers — all are on trips, off duty or suspended.
              </ModalNote>
            ) : (
              <Select
                options={[PICK_DRIVER, ...driverLabels.keys()]}
                value={labelFor(driverLabels, driverId, PICK_DRIVER)}
                onChange={(e) =>
                  setDriverId(driverLabels.get(e.target.value) ?? "")
                }
                disabled={assets.isLoading}
              />
            )}
          </Field>

          <div className="flex gap-4">
            <Field label="Cargo Weight (kg)" className="flex-1">
              <Input
                type="number"
                min="1"
                step="1"
                placeholder="1200"
                value={cargoWeight}
                onChange={(e) => setCargoWeight(e.target.value)}
                className="font-mono"
                required
              />
            </Field>
            <Field label="Planned Distance (km)" className="flex-1">
              <Input
                type="number"
                min="1"
                step="1"
                placeholder="250"
                value={plannedDistance}
                onChange={(e) => setPlannedDistance(e.target.value)}
                className="font-mono"
                required
              />
            </Field>
          </div>

          <ModalActions
            onCancel={() => setNewOpen(false)}
            submitLabel="Create Trip"
            pending={createTrip.isPending}
            error={createTrip.error}
            disabled={!createValid}
          />
        </form>
      </Modal>

      {completeFor && (
        <Modal
          open
          onClose={() => setCompleteFor(null)}
          title={`Complete ${code(completeFor.id)}`}
          subtitle={`${completeFor.source} → ${completeFor.destination} · close the job out with the numbers from the run.`}
          icon={<CheckCircle2 className="size-5" />}
        >
          <form className="flex flex-col gap-5" onSubmit={submitComplete}>
            <div className="flex gap-4">
              <Field label="Actual Distance (km)" className="flex-1">
                <Input
                  type="number"
                  min="0.1"
                  step="0.1"
                  placeholder="250"
                  value={actualDistance}
                  onChange={(e) => setActualDistance(e.target.value)}
                  className="font-mono"
                  required
                />
              </Field>
              <Field label="Fuel Consumed (L)" className="flex-1">
                <Input
                  type="number"
                  min="0.1"
                  step="0.1"
                  placeholder="42"
                  value={fuelConsumed}
                  onChange={(e) => setFuelConsumed(e.target.value)}
                  className="font-mono"
                  required
                />
              </Field>
            </div>

            <div className="flex gap-4">
              <Field label="Fuel Cost (USD) — optional" className="flex-1">
                <Input
                  type="number"
                  min="0.01"
                  step="0.01"
                  placeholder="Leave blank to skip"
                  value={fuelCost}
                  onChange={(e) => setFuelCost(e.target.value)}
                  className="font-mono"
                />
              </Field>
              <Field label="Revenue (USD)" className="flex-1">
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0"
                  value={revenue}
                  onChange={(e) => setRevenue(e.target.value)}
                  className="font-mono"
                  required
                />
              </Field>
            </div>

            <ModalActions
              onCancel={() => setCompleteFor(null)}
              submitLabel="Complete Trip"
              pending={completeTrip.isPending}
              error={completeTrip.error}
              disabled={!completeValid}
            />
          </form>
        </Modal>
      )}

      {cancelFor && (
        <Modal
          open
          onClose={() => setCancelFor(null)}
          title={`Cancel ${code(cancelFor.id)}?`}
          subtitle="A cancelled trip cannot be reopened."
          icon={<AlertTriangle className="size-5" />}
        >
          <form onSubmit={submitCancel}>
            <p className="text-sm text-muted">
              <span className="text-ink">{cancelFor.source}</span> →{" "}
              <span className="text-ink">{cancelFor.destination}</span> will be
              marked Cancelled, and its vehicle and driver return to the
              available pool.
            </p>

            <ModalActions
              onCancel={() => setCancelFor(null)}
              submitLabel="Cancel Trip"
              pending={cancelTrip.isPending}
              error={cancelTrip.error}
            />
          </form>
        </Modal>
      )}
    </>
  );
}

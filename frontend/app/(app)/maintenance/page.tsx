"use client";

import { useMemo, useState, type FormEvent, type ReactNode } from "react";
import {
  AlertTriangle,
  Bus,
  CheckCircle2,
  ClipboardList,
  Truck,
  Wrench,
} from "lucide-react";
import {
  Button,
  Field,
  Input,
  Panel,
  PageHeader,
  Select,
  Table,
  TableFooter,
  Td,
  Th,
  Tr,
} from "@/components/ui";
import { Modal, ModalActions } from "@/components/ui/modal";
import { EmptyState, ErrorState, TableSkeleton } from "@/components/ui/async";
import {
  useCloseMaintenance,
  useCreateMaintenance,
  useMaintenance,
  useVehicles,
} from "@/lib/api/hooks";
import type { MaintenanceLog, MaintenanceStatus } from "@/lib/api/types";

const SERVICE_TYPES = [
  "Oil Change",
  "Brake Pads",
  "Annual Insp.",
  "Tire Rotation",
];

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

/** Rounded outline pill used by the service log — distinct from the square StatusPill. */
function LogPill({
  status,
  children,
}: {
  status: MaintenanceStatus;
  children: ReactNode;
}) {
  const styles =
    status === "Active"
      ? "border-accent/20 bg-accent-dim text-accent"
      : "border-success/25 bg-success-dim text-success";
  return (
    <span
      className={`inline-flex items-center whitespace-nowrap rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase ${styles}`}
    >
      {children}
    </span>
  );
}

/** One node of the vertical workflow rail — decorative, no backing data. */
function WorkflowNode({
  label,
  icon,
  active = false,
  dim = false,
}: {
  label: string;
  icon: ReactNode;
  active?: boolean;
  dim?: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className={
          active
            ? "flex size-20 items-center justify-center rounded-full border-2 border-accent bg-accent/20 text-accent backdrop-blur-[24px] shadow-[0_0_24px_rgba(125,211,252,0.15)]"
            : `glass-elevated flex size-16 items-center justify-center rounded-full border border-line text-muted ${
                dim ? "opacity-50" : ""
              }`
        }
      >
        {icon}
      </div>
      <span className={`label-field ${active ? "text-accent" : ""}`}>
        {label}
      </span>
    </div>
  );
}

function Connector({ lines }: { lines: [string, string] }) {
  return (
    <div className="glass flex h-[50px] flex-col justify-center px-2 py-1">
      {lines.map((line) => (
        <span
          key={line}
          className="text-[9px] font-bold uppercase leading-5 text-muted"
        >
          {line}
        </span>
      ))}
    </div>
  );
}

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <Panel className="flex flex-1 flex-col gap-2 p-6">
      <span className="label-field">{label}</span>
      <div className="flex items-end justify-between">
        <p className="font-mono text-3xl font-black leading-9 text-ink">
          {value}
        </p>
      </div>
    </Panel>
  );
}

export default function MaintenancePage() {
  const {
    data: logs,
    isLoading,
    error,
    refetch,
  } = useMaintenance();
  const { data: vehicles } = useVehicles();
  const createLog = useCreateMaintenance();
  const closeLog = useCloseMaintenance();

  /** The record awaiting confirmation. Null when the confirm dialog is shut. */
  const [closing, setClosing] = useState<MaintenanceLog | null>(null);

  const [vehicleId, setVehicleId] = useState("");
  const [description, setDescription] = useState(SERVICE_TYPES[0]);
  const [cost, setCost] = useState("");
  // POST /maintenance requires startDate in YYYY-MM-DD; default to today.
  const [startDate, setStartDate] = useState(() =>
    new Date().toISOString().slice(0, 10),
  );

  // The <Select> primitive keys options by their own text, so carry the id in the label.
  const PLACEHOLDER = "Select a vehicle";
  const vehicleLabels = useMemo(
    () =>
      new Map(
        (vehicles ?? []).map((v) => [
          `${v.registrationNumber} · ${v.model}`,
          String(v.id),
        ]),
      ),
    [vehicles],
  );
  const selectedLabel =
    [...vehicleLabels.entries()].find(([, id]) => id === vehicleId)?.[0] ??
    PLACEHOLDER;

  const availability = useMemo(() => {
    if (!vehicles || vehicles.length === 0) return "—";
    const available = vehicles.filter((v) => v.status === "Available").length;
    return `${((available / vehicles.length) * 100).toFixed(1)}%`;
  }, [vehicles]);

  const rows = logs ?? [];

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const id = Number(vehicleId);
    const amount = Number(cost);
    if (!id || Number.isNaN(amount) || !description || !startDate) return;
    createLog.mutate(
      { vehicleId: id, description, cost: amount, startDate },
      { onSuccess: () => setCost("") },
    );
  }

  /** Drop the failed attempt with the dialog, so reopening starts clean. */
  function dismissClose() {
    setClosing(null);
    closeLog.reset();
  }

  function onConfirmClose(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!closing) return;
    // POST /maintenance/:id/close — the hook also invalidates the vehicle list, because
    // closing the record is what puts the vehicle back in the dispatch pool.
    closeLog.mutate(closing.id, { onSuccess: () => setClosing(null) });
  }

  return (
    <>
      <PageHeader
        crumbs={["Fleet", "Maintenance & Service Log"]}
        title="Service Log Management"
        subtitle="Log workshop visits and track vehicle turnaround across the fleet."
      />

      <div className="grid grid-cols-12 gap-4">
        {/* Left column — Log Service Record form */}
        <div className="col-span-12 flex flex-col gap-4 lg:col-span-4">
          <Panel className="flex flex-col gap-6 p-6">
            <div className="flex items-center gap-2">
              <ClipboardList className="size-4.5 text-accent" />
              <h2 className="text-xl font-semibold leading-7 text-ink">
                Log Service Record
              </h2>
            </div>

            <form className="flex flex-col gap-5" onSubmit={onSubmit}>
              <Field label="Vehicle">
                <Select
                  options={[PLACEHOLDER, ...vehicleLabels.keys()]}
                  value={selectedLabel}
                  onChange={(e) =>
                    setVehicleId(vehicleLabels.get(e.target.value) ?? "")
                  }
                  className="font-mono"
                />
              </Field>

              <Field label="Service Type">
                <Select
                  options={SERVICE_TYPES}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </Field>

              <div className="flex gap-4">
                <Field label="Start Date" className="flex-1">
                  <Input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="font-mono"
                  />
                </Field>

                <Field label="Cost (USD)" className="flex-1">
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="2500"
                    value={cost}
                    onChange={(e) => setCost(e.target.value)}
                    className="font-mono"
                  />
                </Field>
              </div>

              {createLog.error && (
                <p className="text-sm text-danger">
                  {createLog.error instanceof Error
                    ? createLog.error.message
                    : "Couldn't save the record."}
                </p>
              )}

              <div className="flex gap-3 pt-4">
                <Button
                  type="submit"
                  disabled={createLog.isPending || !vehicleId || cost === ""}
                  className="flex-1 justify-center py-3 text-sm disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {createLog.isPending ? "Saving…" : "Save"}
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 justify-center py-3 text-sm"
                  onClick={() => {
                    setVehicleId("");
                    setDescription(SERVICE_TYPES[0]);
                    setCost("");
                    setStartDate(new Date().toISOString().slice(0, 10));
                    createLog.reset();
                  }}
                >
                  Reset
                </Button>
              </div>
            </form>
          </Panel>

          <div className="flex gap-3 rounded-lg border border-danger/25 bg-emergency/60 p-4 backdrop-blur-[16px]">
            <AlertTriangle className="mt-0.5 size-5 shrink-0 text-emergency-ink/90" />
            <p className="text-sm leading-[22px] text-emergency-ink/90">
              <span className="font-bold">System Protocol:</span> In Shop
              vehicles are automatically removed from the dispatch pool to
              prevent routing errors.
            </p>
          </div>
        </div>

        {/* Middle column — workflow visualizer (decorative) */}
        <div className="col-span-12 flex flex-col items-center justify-center gap-2 py-10 lg:col-span-2">
          <WorkflowNode
            label="Available"
            icon={<CheckCircle2 className="size-5" />}
          />
          <Connector lines={["Creating", "Record"]} />
          <WorkflowNode
            label="In Shop"
            icon={<Wrench className="size-6" />}
            active
          />
          <Connector lines={["Closing", "Record"]} />
          <WorkflowNode
            label="Available"
            icon={<CheckCircle2 className="size-5" />}
            dim
          />
        </div>

        {/* Right column — service log table + stat tile */}
        <div className="col-span-12 flex flex-col gap-4 lg:col-span-6">
          <Panel className="overflow-hidden">
            {/* The filter and download icons that used to sit here are gone. Nothing
                backs either: there is no filter param on GET /maintenance, and the only
                export the API has is /analytics/export/csv — a fleet-wide cost sheet, not
                this service log. A download icon on a "Service Log" panel that hands back
                somebody else's table is worse than no icon at all. */}
            <div className="flex items-center justify-between border-b border-line px-6 py-5">
              <h2 className="text-xl font-semibold leading-7 text-ink">
                Service Log
              </h2>
            </div>

            {isLoading ? (
              <TableSkeleton rows={4} cols={4} />
            ) : error ? (
              <ErrorState error={error} onRetry={() => refetch()} />
            ) : rows.length === 0 ? (
              <EmptyState
                title="No service records yet"
                hint="Log a workshop visit with the form on the left and it will appear here."
                icon={<Wrench className="size-7 text-muted" />}
              />
            ) : (
              <Table>
                <thead>
                  <tr>
                    <Th className="px-2 whitespace-nowrap">Vehicle</Th>
                    <Th className="px-2 whitespace-nowrap">Service Type</Th>
                    <Th align="right" className="px-2 whitespace-nowrap">
                      Cost
                    </Th>
                    <Th className="px-2 whitespace-nowrap">Status</Th>
                    <Th className="px-2 w-8">
                      <span className="sr-only">Actions</span>
                    </Th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((log) => {
                    const isBus = /bus/i.test(log.vehicle?.type ?? "");
                    return (
                      <Tr key={log.id}>
                        <Td className="px-2">
                          <div className="flex items-center gap-2.5">
                            <span className="flex size-8 shrink-0 items-center justify-center rounded bg-surface-4 text-muted">
                              {isBus ? (
                                <Bus className="size-3.5" />
                              ) : (
                                <Truck className="size-3.5" />
                              )}
                            </span>
                            <span className="whitespace-nowrap text-sm font-bold text-ink">
                              {log.vehicle?.registrationNumber ??
                                log.vehicle?.model ??
                                `#${log.vehicleId}`}
                            </span>
                          </div>
                        </Td>
                        <Td className="px-2 whitespace-nowrap text-sm text-muted">
                          {log.description}
                        </Td>
                        <Td
                          align="right"
                          mono
                          className="px-2 whitespace-nowrap text-sm"
                        >
                          {currency.format(log.cost)}
                        </Td>
                        <Td className="px-2">
                          <LogPill status={log.status}>{log.status}</LogPill>
                        </Td>
                        {/* Only an Active record can be closed — a Closed one gets no
                            action rather than a disabled control that never fires. */}
                        <Td className="px-2">
                          {log.status === "Active" && (
                            <button
                              type="button"
                              onClick={() => setClosing(log)}
                              className="whitespace-nowrap rounded border border-accent/30 bg-accent-faint px-2 py-0.5 text-[10px] font-bold uppercase text-accent transition hover:border-accent/50 hover:bg-accent/20"
                            >
                              Close
                            </button>
                          )}
                        </Td>
                      </Tr>
                    );
                  })}
                </tbody>
              </Table>
            )}

            <TableFooter
              summary={`${rows.length} ${rows.length === 1 ? "record" : "records"}`}
              pages={1}
            />
          </Panel>

          <div className="flex gap-4">
            <StatTile label="Fleet Availability" value={availability} />
          </div>
        </div>
      </div>

      {closing && (
        <Modal
          open
          onClose={dismissClose}
          title="Close service record"
          subtitle="This ends the workshop visit and returns the vehicle to the dispatch pool."
          icon={<CheckCircle2 className="size-5" />}
        >
          <form onSubmit={onConfirmClose}>
            <dl className="flex flex-col gap-3 rounded-lg border border-line bg-surface px-4 py-3">
              <div className="flex items-baseline justify-between gap-4">
                <dt className="label-field">Vehicle</dt>
                <dd className="font-mono text-sm text-ink">
                  {closing.vehicle?.registrationNumber ??
                    closing.vehicle?.model ??
                    `#${closing.vehicleId}`}
                </dd>
              </div>
              <div className="flex items-baseline justify-between gap-4">
                <dt className="label-field">Service</dt>
                <dd className="text-sm text-ink">{closing.description}</dd>
              </div>
              <div className="flex items-baseline justify-between gap-4">
                <dt className="label-field">Cost</dt>
                <dd className="font-mono text-sm text-ink">
                  {currency.format(closing.cost)}
                </dd>
              </div>
            </dl>

            <ModalActions
              onCancel={dismissClose}
              submitLabel="Close Record"
              pending={closeLog.isPending}
              error={closeLog.error}
            />
          </form>
        </Modal>
      )}
    </>
  );
}

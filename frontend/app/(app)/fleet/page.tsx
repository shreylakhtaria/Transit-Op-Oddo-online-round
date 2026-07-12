"use client";

import { useMemo, useState } from "react";
import { Plus, Search, Filter, Info, Pencil, Trash2, Truck } from "lucide-react";
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
  useCreateVehicle,
  useDeleteVehicle,
  useUpdateVehicle,
  useVehicles,
} from "@/lib/api/hooks";
import type { CreateVehicleBody, Vehicle, VehicleStatus } from "@/lib/api/types";

const STATUS_TONE: Record<VehicleStatus, Tone> = {
  Available: "success",
  "On Trip": "warn",
  "In Shop": "danger",
  Retired: "neutral",
};

const VEHICLE_STATUSES: VehicleStatus[] = [
  "Available",
  "On Trip",
  "In Shop",
  "Retired",
];

const ALL_TYPES = "All Types";
const ALL_STATUS = "All Status";
const PAGE_SIZE = 10;

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

/**
 * The form mirrors CreateVehicleBody, but every field is held as a string —
 * that's what <input> gives back. The numbers are coerced once, in `bodyOf`,
 * because the API's validator rejects "12000" where it wants 12000.
 */
type VehicleForm = {
  registrationNumber: string;
  model: string;
  type: string;
  maxLoadCapacity: string;
  odometer: string;
  acquisitionCost: string;
  status: VehicleStatus;
};

const EMPTY_FORM: VehicleForm = {
  registrationNumber: "",
  model: "",
  type: "",
  maxLoadCapacity: "",
  odometer: "",
  acquisitionCost: "",
  status: "Available",
};

const formOf = (v: Vehicle): VehicleForm => ({
  registrationNumber: v.registrationNumber,
  model: v.model,
  type: v.type,
  maxLoadCapacity: String(v.maxLoadCapacity),
  odometer: String(v.odometer),
  acquisitionCost: String(v.acquisitionCost),
  status: v.status,
});

const bodyOf = (form: VehicleForm): CreateVehicleBody => ({
  registrationNumber: form.registrationNumber.trim(),
  model: form.model.trim(),
  type: form.type.trim(),
  maxLoadCapacity: Number(form.maxLoadCapacity),
  odometer: Number(form.odometer),
  acquisitionCost: Number(form.acquisitionCost),
  status: form.status,
});

const isNumeric = (value: string) =>
  value.trim() !== "" && Number.isFinite(Number(value));

type Dialog =
  | { kind: "create" }
  | { kind: "edit"; vehicle: Vehicle }
  | { kind: "delete"; vehicle: Vehicle };

export default function FleetPage() {
  const { data, isLoading, error, refetch } = useVehicles();

  const [type, setType] = useState(ALL_TYPES);
  const [status, setStatus] = useState(ALL_STATUS);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);

  const [dialog, setDialog] = useState<Dialog | null>(null);
  const [form, setForm] = useState<VehicleForm>(EMPTY_FORM);

  const create = useCreateVehicle();
  const update = useUpdateVehicle();
  const remove = useDeleteVehicle();

  const vehicles = useMemo(() => data ?? [], [data]);

  const typeOptions = useMemo(
    () => [ALL_TYPES, ...Array.from(new Set(vehicles.map((v) => v.type)))],
    [vehicles],
  );

  const rows = useMemo(
    () =>
      vehicles.filter(
        (v) =>
          (type === ALL_TYPES || v.type === type) &&
          (status === ALL_STATUS || v.status === status) &&
          v.registrationNumber.toLowerCase().includes(query.trim().toLowerCase()),
      ),
    [vehicles, type, status, query],
  );

  // Filters reset the page, but a delete can also strip the last row off the
  // final page — clamp so we never render an empty slice of a non-empty list.
  const pages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const current = Math.min(page, pages);
  const start = (current - 1) * PAGE_SIZE;
  const pageRows = rows.slice(start, start + PAGE_SIZE);

  const resetFilters = () => {
    setType(ALL_TYPES);
    setStatus(ALL_STATUS);
    setQuery("");
    setPage(1);
  };

  const setField = <K extends keyof VehicleForm>(
    key: K,
    value: VehicleForm[K],
  ) => setForm((prev) => ({ ...prev, [key]: value }));

  const openCreate = () => {
    create.reset();
    setForm(EMPTY_FORM);
    setDialog({ kind: "create" });
  };

  const openEdit = (vehicle: Vehicle) => {
    update.reset();
    setForm(formOf(vehicle));
    setDialog({ kind: "edit", vehicle });
  };

  const openDelete = (vehicle: Vehicle) => {
    remove.reset();
    setDialog({ kind: "delete", vehicle });
  };

  const closeDialog = () => setDialog(null);

  const editing = dialog?.kind === "edit" ? dialog.vehicle : null;
  const deleting = dialog?.kind === "delete" ? dialog.vehicle : null;
  // One modal serves both create and edit; the live mutation follows the mode.
  const saving = editing ? update : create;

  const formValid =
    form.registrationNumber.trim() !== "" &&
    form.model.trim() !== "" &&
    form.type.trim() !== "" &&
    isNumeric(form.maxLoadCapacity) &&
    isNumeric(form.odometer) &&
    isNumeric(form.acquisitionCost);

  const submitForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dialog || dialog.kind === "delete" || !formValid) return;

    const body = bodyOf(form);

    if (dialog.kind === "create") {
      create.mutate(body, {
        onSuccess: () => {
          setForm(EMPTY_FORM);
          closeDialog();
        },
      });
    } else {
      update.mutate({ id: dialog.vehicle.id, ...body }, { onSuccess: closeDialog });
    }
  };

  const confirmDelete = (e: React.FormEvent) => {
    e.preventDefault();
    if (dialog?.kind !== "delete") return;
    remove.mutate(dialog.vehicle.id, { onSuccess: closeDialog });
  };

  return (
    <>
      <PageHeader
        crumbs={["Fleet", "Registry"]}
        title="Vehicle Registry"
        subtitle="Manage and audit the centralized transportation asset database."
        action={
          <Button
            icon={<Plus className="size-3.5" strokeWidth={3} />}
            onClick={openCreate}
          >
            Add Vehicle
          </Button>
        }
      />

      <div className="glass flex items-end gap-4 rounded-xl px-4 pb-4 pt-6">
        <Field label="Vehicle Type">
          <Select
            options={typeOptions}
            value={type}
            onChange={(e) => {
              setType(e.target.value);
              setPage(1);
            }}
            className="w-44"
          />
        </Field>
        <Field label="Service Status">
          <Select
            // Driven off the real enum. A hardcoded list had "In Maintenance", which the
            // database calls "In Shop" — so that option silently matched nothing.
            options={[ALL_STATUS, ...VEHICLE_STATUSES]}
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            className="w-44"
          />
        </Field>
        <Field label="Registration Number" className="flex-1">
          <Input
            placeholder="Search reg. no (e.g. GJ01AB...)"
            icon={<Search className="size-3.5" />}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
          />
        </Field>
        <Button
          variant="ghost"
          className="px-2 pb-2.5 text-sm"
          onClick={resetFilters}
        >
          <Filter className="size-4" />
          Reset Filters
        </Button>
      </div>

      {error ? (
        <ErrorState error={error} onRetry={() => refetch()} />
      ) : (
        <Panel className="overflow-hidden">
          {isLoading ? (
            <TableSkeleton cols={7} />
          ) : rows.length === 0 ? (
            <EmptyState
              title="No vehicles yet"
              hint={
                vehicles.length === 0
                  ? "Add a vehicle to start building the asset registry."
                  : "No assets match the current filters."
              }
            />
          ) : (
            <>
              <Table>
                <thead>
                  <tr>
                    <Th>Reg No.</Th>
                    <Th>Name/Model</Th>
                    <Th>Type</Th>
                    <Th>Capacity</Th>
                    <Th align="right">Odometer</Th>
                    <Th align="right">Acq. Cost</Th>
                    <Th>Status</Th>
                    {/* Shrink-to-fit so the actions column costs the table no width. */}
                    <Th align="right" className="px-2 w-px">
                      <span className="sr-only">Actions</span>
                    </Th>
                  </tr>
                </thead>
                <tbody>
                  {pageRows.map((v) => (
                    <Tr key={v.id}>
                      <Td mono className="text-[13px] text-accent">
                        {v.registrationNumber}
                      </Td>
                      <Td>
                        <span className="text-ink">{v.model} </span>
                        <span className="block text-[10px] font-bold text-muted">
                          {v.type}
                        </span>
                      </Td>
                      <Td className="text-muted">{v.type}</Td>
                      <Td>{v.maxLoadCapacity}kg</Td>
                      <Td align="right" mono>
                        {v.odometer.toLocaleString()} km
                      </Td>
                      <Td align="right" mono>
                        {currency.format(v.acquisitionCost)}
                      </Td>
                      <Td>
                        <StatusPill tone={STATUS_TONE[v.status] ?? "neutral"}>
                          {v.status}
                        </StatusPill>
                      </Td>
                      <Td className="px-2 w-px whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => openEdit(v)}
                            aria-label={`Edit ${v.registrationNumber}`}
                            className="flex size-7 items-center justify-center rounded-lg text-muted transition hover:bg-accent/10 hover:text-accent"
                          >
                            <Pencil className="size-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => openDelete(v)}
                            aria-label={`Delete ${v.registrationNumber}`}
                            className="flex size-7 items-center justify-center rounded-lg text-muted transition hover:bg-danger/10 hover:text-danger"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </div>
                      </Td>
                    </Tr>
                  ))}
                </tbody>
              </Table>
              <TableFooter
                summary={`Showing ${start + 1}-${start + pageRows.length} of ${rows.length} assets`}
                pages={pages}
                current={current}
                onPageChange={setPage}
              />
            </>
          )}
        </Panel>
      )}

      <RuleNote icon={<Info className="size-4 shrink-0 text-muted" />}>
        <span className="font-bold text-ink">Registry Policy:</span> Registration
        No. must be unique <span className="text-line">•</span> Retired/In Shop
        vehicles are hidden from Trip Dispatcher view.
      </RuleNote>

      <Modal
        open={dialog?.kind === "create" || dialog?.kind === "edit"}
        onClose={closeDialog}
        title={editing ? "Edit Vehicle" : "Add Vehicle"}
        subtitle={
          editing
            ? `Update the registry record for ${editing.registrationNumber}.`
            : "Register a new asset in the centralized fleet database."
        }
        icon={<Truck className="size-5" />}
      >
        <form onSubmit={submitForm} className="flex flex-col gap-4">
          <Field label="Registration Number">
            <Input
              required
              value={form.registrationNumber}
              onChange={(e) => setField("registrationNumber", e.target.value)}
              placeholder="GJ01AB1234"
            />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Name / Model">
              <Input
                required
                value={form.model}
                onChange={(e) => setField("model", e.target.value)}
                placeholder="Tata Ace Gold"
              />
            </Field>
            <Field label="Type">
              <Input
                required
                value={form.type}
                onChange={(e) => setField("type", e.target.value)}
                placeholder="Mini Truck"
              />
            </Field>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <Field label="Max Load (kg)">
              <Input
                required
                type="number"
                min={0}
                step="any"
                value={form.maxLoadCapacity}
                onChange={(e) => setField("maxLoadCapacity", e.target.value)}
                placeholder="12000"
              />
            </Field>
            <Field label="Odometer (km)">
              <Input
                required
                type="number"
                min={0}
                step="any"
                value={form.odometer}
                onChange={(e) => setField("odometer", e.target.value)}
                placeholder="0"
              />
            </Field>
            <Field label="Acq. Cost">
              <Input
                required
                type="number"
                min={0}
                step="any"
                value={form.acquisitionCost}
                onChange={(e) => setField("acquisitionCost", e.target.value)}
                placeholder="450000"
              />
            </Field>
          </div>

          <Field label="Status">
            <Select
              options={VEHICLE_STATUSES}
              value={form.status}
              onChange={(e) =>
                setField("status", e.target.value as VehicleStatus)
              }
            />
          </Field>

          <ModalActions
            onCancel={closeDialog}
            submitLabel={editing ? "Save Changes" : "Add Vehicle"}
            pending={saving.isPending}
            error={saving.error}
            disabled={!formValid}
          />
        </form>
      </Modal>

      <Modal
        open={dialog?.kind === "delete"}
        onClose={closeDialog}
        title="Delete Vehicle"
        subtitle="This asset will be removed from the registry."
        icon={<Trash2 className="size-5" />}
      >
        <form onSubmit={confirmDelete}>
          <p className="text-sm leading-6 text-muted">
            <span className="font-mono text-accent">
              {deleting?.registrationNumber}
            </span>{" "}
            <span className="text-ink">({deleting?.model})</span> will be
            permanently removed from the fleet. Trip history and expenses that
            reference it may be affected. This cannot be undone.
          </p>
          <ModalActions
            onCancel={closeDialog}
            submitLabel="Delete Vehicle"
            pending={remove.isPending}
            error={remove.error}
          />
        </form>
      </Modal>
    </>
  );
}

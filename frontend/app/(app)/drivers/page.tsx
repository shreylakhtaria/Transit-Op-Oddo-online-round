"use client";

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  BadgeCheck,
  Pencil,
  Plus,
  RefreshCw,
  ShieldOff,
  Trash2,
  UserPlus,
} from "lucide-react";
import {
  Button,
  Field,
  Input,
  Panel,
  Select,
  StatusPill,
  Table,
  TableFooter,
  Td,
  Th,
  type Tone,
} from "@/components/ui";
import { EmptyState, ErrorState, TableSkeleton } from "@/components/ui/async";
import { Modal, ModalActions } from "@/components/ui/modal";
import {
  useCreateDriver,
  useDeleteDriver,
  useDrivers,
  useUpdateDriver,
} from "@/lib/api/hooks";
import type { CreateDriverBody, Driver, DriverStatus } from "@/lib/api/types";

const STATUS_TONE: Record<DriverStatus, Tone> = {
  Available: "success",
  "On Trip": "warn",
  "Off Duty": "neutral",
  Suspended: "danger",
};

const DRIVER_STATUSES: DriverStatus[] = [
  "Available",
  "On Trip",
  "Off Duty",
  "Suspended",
];

/**
 * "Toggle Status" cycles Available ↔ Off Duty. A driver who is On Trip or
 * Suspended is deliberately outside that cycle: a bulk control must not quietly
 * pull someone off a live trip, and lifting a suspension is a safety decision,
 * not a two-click one. If the selection contains nothing togglable the button
 * stays disabled rather than firing requests that change nothing.
 */
const TOGGLEABLE: DriverStatus[] = ["Available", "Off Duty"];

/** A driver is safe-flagged above this score; below it the row shows the warning glyph. */
const SAFE_SCORE = 80;

const PAGE_SIZE = 10;

/** Dates arrive as `YYYY-MM-DD` — pin them to UTC so the day never shifts. */
const toUtcDate = (iso: string) => new Date(`${iso.slice(0, 10)}T00:00:00Z`);

const formatExpiry = (iso: string) => {
  const date = toUtcDate(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
};

const isExpired = (iso: string) => {
  const date = toUtcDate(iso);
  return !Number.isNaN(date.getTime()) && date.getTime() < Date.now();
};

const initialsOf = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0] ?? "")
    .join("")
    .toUpperCase() || "?";

/**
 * The form mirrors CreateDriverBody, but every field is held as a string — that's
 * what an <input> hands back. `safetyScore` is coerced once, in `bodyOf`, because
 * the API's validator rejects "100" where it wants 100.
 */
type DriverForm = {
  name: string;
  licenseNumber: string;
  licenseCategory: string;
  licenseExpiryDate: string;
  contactNumber: string;
  safetyScore: string;
  status: DriverStatus;
};

const EMPTY_FORM: DriverForm = {
  name: "",
  licenseNumber: "",
  licenseCategory: "",
  licenseExpiryDate: "",
  contactNumber: "",
  safetyScore: "100",
  status: "Available",
};

const formOf = (d: Driver): DriverForm => ({
  name: d.name,
  licenseNumber: d.licenseNumber,
  licenseCategory: d.licenseCategory,
  // <input type="date"> only accepts YYYY-MM-DD; the API can hand back a full ISO stamp.
  licenseExpiryDate: d.licenseExpiryDate.slice(0, 10),
  contactNumber: d.contactNumber,
  safetyScore: String(d.safetyScore),
  status: d.status,
});

const bodyOf = (form: DriverForm): CreateDriverBody => ({
  name: form.name.trim(),
  licenseNumber: form.licenseNumber.trim(),
  licenseCategory: form.licenseCategory.trim(),
  licenseExpiryDate: form.licenseExpiryDate,
  contactNumber: form.contactNumber.trim(),
  safetyScore: Number(form.safetyScore),
  status: form.status,
});

const messageOf = (error: unknown) =>
  error instanceof Error ? error.message : String(error);

type Dialog =
  | { kind: "create" }
  | { kind: "edit"; driver: Driver }
  | { kind: "delete"; driver: Driver };

/** Small square checkbox styled like the Figma table selector. */
function Checkbox({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: () => void;
  label: string;
}) {
  return (
    <input
      type="checkbox"
      aria-label={label}
      checked={checked}
      onChange={onChange}
      className="size-4 cursor-pointer appearance-none rounded border border-line bg-accent-faint checked:border-accent checked:bg-accent"
    />
  );
}

export default function DriversPage() {
  const { data, isLoading, error, refetch } = useDrivers();
  const [selected, setSelected] = useState<number[]>([]);
  const [page, setPage] = useState(1);

  const [dialog, setDialog] = useState<Dialog | null>(null);
  const [form, setForm] = useState<DriverForm>(EMPTY_FORM);

  const create = useCreateDriver();
  const update = useUpdateDriver();
  const remove = useDeleteDriver();
  // A second observer, separate from `update`, so the bulk toggle's pending and
  // error state never bleeds into the edit modal (or the other way round).
  const bulk = useUpdateDriver();

  const [bulkPending, setBulkPending] = useState(false);
  const [bulkError, setBulkError] = useState<string | null>(null);

  const drivers: Driver[] = useMemo(() => data ?? [], [data]);

  const avgSafety = drivers.length
    ? Math.round(
        drivers.reduce((sum, d) => sum + d.safetyScore, 0) / drivers.length,
      )
    : 0;

  const stats = [
    { value: String(drivers.length).padStart(2, "0"), label: "Total Drivers" },
    { value: drivers.length ? `${avgSafety}%` : "—", label: "Avg Safety Score" },
  ];

  // Deleting the last row of the final page would leave `page` past the end —
  // clamp so we never render an empty slice of a non-empty roster.
  const pages = Math.max(1, Math.ceil(drivers.length / PAGE_SIZE));
  const current = Math.min(page, pages);
  const start = (current - 1) * PAGE_SIZE;
  const pageRows = drivers.slice(start, start + PAGE_SIZE);

  // The header checkbox covers the rows you can actually see; selections made on
  // another page survive paging, and the bulk action still honours them.
  const allSelected =
    pageRows.length > 0 && pageRows.every((d) => selected.includes(d.id));

  const toggleAll = () =>
    setSelected((prev) => {
      const ids = pageRows.map((d) => d.id);
      return allSelected
        ? prev.filter((id) => !ids.includes(id))
        : [...new Set([...prev, ...ids])];
    });

  const toggleOne = (id: number) =>
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );

  const toggleTargets = drivers.filter(
    (d) => selected.includes(d.id) && TOGGLEABLE.includes(d.status),
  );

  const toggleStatus = async () => {
    if (toggleTargets.length === 0) return;

    setBulkPending(true);
    setBulkError(null);

    const results = await Promise.allSettled(
      toggleTargets.map((d) =>
        bulk.mutateAsync({
          id: d.id,
          status: d.status === "Available" ? "Off Duty" : "Available",
        }),
      ),
    );

    const failures = results.filter(
      (r): r is PromiseRejectedResult => r.status === "rejected",
    );

    if (failures.length > 0) {
      // The API's own words — a 403 from RBAC should read as RBAC, not as a crash.
      setBulkError(messageOf(failures[0].reason));
    } else {
      setSelected([]);
    }

    setBulkPending(false);
  };

  const setField = <K extends keyof DriverForm>(key: K, value: DriverForm[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const openCreate = () => {
    create.reset();
    setForm(EMPTY_FORM);
    setDialog({ kind: "create" });
  };

  const openEdit = (driver: Driver) => {
    update.reset();
    setForm(formOf(driver));
    setDialog({ kind: "edit", driver });
  };

  const openDelete = (driver: Driver) => {
    remove.reset();
    setDialog({ kind: "delete", driver });
  };

  const closeDialog = () => setDialog(null);

  const editing = dialog?.kind === "edit" ? dialog.driver : null;
  const deleting = dialog?.kind === "delete" ? dialog.driver : null;
  // One modal serves both create and edit; the live mutation follows the mode.
  const saving = editing ? update : create;

  const score = Number(form.safetyScore);
  const formValid =
    form.name.trim() !== "" &&
    form.licenseNumber.trim() !== "" &&
    form.licenseCategory.trim() !== "" &&
    form.licenseExpiryDate !== "" &&
    form.contactNumber.trim() !== "" &&
    form.safetyScore.trim() !== "" &&
    Number.isFinite(score) &&
    score >= 0 &&
    score <= 100;

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
      update.mutate(
        { id: dialog.driver.id, ...body },
        { onSuccess: closeDialog },
      );
    }
  };

  const confirmDelete = (e: React.FormEvent) => {
    e.preventDefault();
    if (dialog?.kind !== "delete") return;

    const { id } = dialog.driver;
    remove.mutate(id, {
      onSuccess: () => {
        // Don't leave a deleted driver sitting in the bulk selection.
        setSelected((prev) => prev.filter((x) => x !== id));
        closeDialog();
      },
    });
  };

  return (
    <>
      <div className="flex items-end justify-between">
        <div className="flex flex-col">
          <h1 className="text-2xl font-semibold leading-8 tracking-[-0.6px] text-ink">
            Drivers
          </h1>
          <p className="text-base leading-6 text-muted">
            Personnel management and safety compliance monitoring.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            className="bg-surface-2 px-4 py-2 text-[13px] text-muted disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-line disabled:hover:bg-surface-2"
            icon={
              <RefreshCw
                className={`size-3.5 ${bulkPending ? "animate-spin" : ""}`}
              />
            }
            onClick={toggleStatus}
            disabled={bulkPending || toggleTargets.length === 0}
            title={
              toggleTargets.length === 0
                ? "Select drivers who are Available or Off Duty to cycle their status."
                : `Cycle ${toggleTargets.length} selected driver(s) between Available and Off Duty.`
            }
          >
            Toggle Status
          </Button>
          <Button
            className="px-5 py-2 text-[13px]"
            icon={<Plus className="size-3" strokeWidth={3} />}
            onClick={openCreate}
          >
            Add Driver
          </Button>
        </div>
      </div>

      {bulkError && (
        <p
          role="alert"
          className="rounded-lg border border-danger/30 bg-danger-dim px-3 py-2 text-sm text-danger"
        >
          {bulkError}
        </p>
      )}

      <div className="grid grid-cols-12 gap-4">
        <Panel className="col-span-12 flex min-h-[173px] flex-col justify-center gap-2 px-8 py-6 lg:col-span-8">
          <h2 className="text-xl font-semibold leading-7 text-accent">
            Safety Protocol Active
          </h2>
          <p className="max-w-md text-sm leading-5 text-muted">
            All drivers are currently being tracked via GPS and Telematics.
            <br />
            Safety rating reflects the last 30 operational days.
          </p>
          <div className="flex gap-6 pt-1">
            {stats.map((s) => (
              <div key={s.label} className="flex flex-col">
                <span className="font-mono text-xl font-bold leading-[30px] text-ink">
                  {isLoading ? "—" : s.value}
                </span>
                <span className="text-[10px] leading-[15px] text-muted">
                  {s.label}
                </span>
              </div>
            ))}
          </div>
        </Panel>

        <div className="col-span-12 flex min-h-[173px] flex-col justify-center gap-2 rounded-xl border border-danger/25 bg-emergency/60 p-6 backdrop-blur-[16px] lg:col-span-4">
          <div className="flex items-center gap-3">
            <ShieldOff className="size-[18px] shrink-0 text-emergency-ink" />
            <span className="text-xs uppercase leading-[18px] tracking-[1.2px] text-emergency-ink">
              Deployment Restriction
            </span>
          </div>
          <p className="text-sm font-medium leading-[22.75px] text-ink">
            Any personnel with an{" "}
            <span className="font-bold text-emergency-ink">
              Expired License
            </span>{" "}
            or{" "}
            <span className="font-bold text-emergency-ink">
              Suspended Status
            </span>{" "}
            will be automatically blocked from trip assignment by the system.
          </p>
        </div>
      </div>

      {error ? (
        <ErrorState error={error} onRetry={() => refetch()} />
      ) : (
        <Panel className="overflow-hidden">
          {isLoading ? (
            <TableSkeleton cols={8} />
          ) : drivers.length === 0 ? (
            <EmptyState
              title="No drivers yet"
              hint="Onboard a driver to start tracking licences and safety compliance."
            />
          ) : (
            <>
              <Table>
                <thead>
                  <tr>
                    <Th className="px-3 w-10">
                      <Checkbox
                        checked={allSelected}
                        onChange={toggleAll}
                        label="Select all drivers on this page"
                      />
                    </Th>
                    <Th className="px-3 whitespace-nowrap">Driver</Th>
                    <Th className="px-3 whitespace-nowrap">License No.</Th>
                    <Th className="px-2 whitespace-nowrap">Cat.</Th>
                    <Th className="px-3 whitespace-nowrap">Expiry</Th>
                    <Th className="px-3 whitespace-nowrap">Contact</Th>
                    <Th className="px-2 whitespace-nowrap">Safety</Th>
                    <Th className="px-3 w-[110px] whitespace-nowrap">Status</Th>
                    {/* `w-px` shrinks to min-content, so actions cost the table no width. */}
                    <Th align="right" className="px-2 w-px">
                      <span className="sr-only">Actions</span>
                    </Th>
                  </tr>
                </thead>
                <tbody>
                  {pageRows.map((d) => {
                    const expired = isExpired(d.licenseExpiryDate);
                    const safe = d.safetyScore >= SAFE_SCORE;
                    const flagged = expired || d.status === "Suspended";

                    return (
                      <tr
                        key={d.id}
                        className={`border-t border-line-soft transition-colors ${
                          flagged ? "bg-danger/5" : "hover:bg-accent/[0.04]"
                        }`}
                      >
                        <Td className="px-3">
                          <Checkbox
                            checked={selected.includes(d.id)}
                            onChange={() => toggleOne(d.id)}
                            label={`Select ${d.name}`}
                          />
                        </Td>
                        <Td className="px-3">
                          <div className="flex items-center gap-2.5">
                            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-surface-4 text-xs font-bold text-accent">
                              {initialsOf(d.name)}
                            </span>
                            <span className="whitespace-nowrap text-sm font-semibold text-ink">
                              {d.name}
                            </span>
                          </div>
                        </Td>
                        <Td mono className="px-3 whitespace-nowrap text-[12px]">
                          {d.licenseNumber}
                        </Td>
                        <Td className="px-2">
                          <span className="inline-flex rounded border border-line-soft bg-line/20 px-1.5 py-0.5 text-[10px] font-bold leading-[15px] text-muted">
                            {d.licenseCategory}
                          </span>
                        </Td>
                        <Td
                          mono
                          className={`px-3 whitespace-nowrap text-[12px] ${
                            expired ? "text-emergency-ink" : "text-ink"
                          }`}
                        >
                          {formatExpiry(d.licenseExpiryDate)}
                        </Td>
                        <Td className="px-3">
                          <span className="block whitespace-nowrap text-[13px] leading-5 text-ink">
                            {d.contactNumber}
                          </span>
                          {d.user?.email && (
                            <span className="block whitespace-nowrap text-[11px] leading-[16.5px] text-muted">
                              {d.user.email}
                            </span>
                          )}
                        </Td>
                        <Td className="px-2">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`flex size-6 shrink-0 items-center justify-center rounded-full ${
                                safe
                                  ? "bg-accent/20 text-accent"
                                  : "bg-danger-dim text-danger"
                              }`}
                            >
                              {safe ? (
                                <BadgeCheck className="size-3.5" />
                              ) : (
                                <AlertTriangle className="size-3.5" />
                              )}
                            </span>
                            <span className="font-mono text-sm text-ink">
                              {d.safetyScore}
                            </span>
                          </div>
                        </Td>
                        <Td className="px-3">
                          <StatusPill tone={STATUS_TONE[d.status] ?? "neutral"}>
                            <span className="whitespace-nowrap">{d.status}</span>
                          </StatusPill>
                        </Td>
                        <Td className="px-2 w-px whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => openEdit(d)}
                              aria-label={`Edit ${d.name}`}
                              className="flex size-7 items-center justify-center rounded-lg text-muted transition hover:bg-accent/10 hover:text-accent"
                            >
                              <Pencil className="size-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => openDelete(d)}
                              aria-label={`Delete ${d.name}`}
                              className="flex size-7 items-center justify-center rounded-lg text-muted transition hover:bg-danger/10 hover:text-danger"
                            >
                              <Trash2 className="size-3.5" />
                            </button>
                          </div>
                        </Td>
                      </tr>
                    );
                  })}
                </tbody>
              </Table>
              <TableFooter
                summary={`Showing ${start + 1}-${start + pageRows.length} of ${drivers.length} drivers`}
                pages={pages}
                current={current}
                onPageChange={setPage}
              />
            </>
          )}
        </Panel>
      )}

      <Modal
        open={dialog?.kind === "create" || dialog?.kind === "edit"}
        onClose={closeDialog}
        title={editing ? "Edit Driver" : "Add Driver"}
        subtitle={
          editing
            ? `Update the personnel record for ${editing.name}.`
            : "Onboard a driver and register their licence for compliance checks."
        }
        icon={<UserPlus className="size-5" />}
      >
        <form onSubmit={submitForm} className="flex flex-col gap-4">
          <Field label="Full Name">
            <Input
              required
              value={form.name}
              onChange={(e) => setField("name", e.target.value)}
              placeholder="Rajesh Kumar"
            />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="License Number">
              <Input
                required
                value={form.licenseNumber}
                onChange={(e) => setField("licenseNumber", e.target.value)}
                placeholder="GJ0120190012345"
              />
            </Field>
            <Field label="License Category">
              <Input
                required
                value={form.licenseCategory}
                onChange={(e) => setField("licenseCategory", e.target.value)}
                placeholder="HMV"
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="License Expiry">
              <Input
                required
                type="date"
                value={form.licenseExpiryDate}
                onChange={(e) => setField("licenseExpiryDate", e.target.value)}
              />
            </Field>
            <Field label="Contact Number">
              <Input
                required
                type="tel"
                value={form.contactNumber}
                onChange={(e) => setField("contactNumber", e.target.value)}
                placeholder="+91 98765 43210"
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Safety Score (0-100)">
              <Input
                required
                type="number"
                min={0}
                max={100}
                step={1}
                value={form.safetyScore}
                onChange={(e) => setField("safetyScore", e.target.value)}
                placeholder="100"
              />
            </Field>
            <Field label="Status">
              <Select
                options={DRIVER_STATUSES}
                value={form.status}
                onChange={(e) =>
                  setField("status", e.target.value as DriverStatus)
                }
              />
            </Field>
          </div>

          <ModalActions
            onCancel={closeDialog}
            submitLabel={editing ? "Save Changes" : "Add Driver"}
            pending={saving.isPending}
            error={saving.error}
            disabled={!formValid}
          />
        </form>
      </Modal>

      <Modal
        open={dialog?.kind === "delete"}
        onClose={closeDialog}
        title="Delete Driver"
        subtitle="This person will be removed from the roster."
        icon={<Trash2 className="size-5" />}
      >
        <form onSubmit={confirmDelete}>
          <p className="text-sm leading-6 text-muted">
            <span className="text-ink">{deleting?.name}</span> (
            <span className="font-mono text-accent">
              {deleting?.licenseNumber}
            </span>
            ) will be permanently removed from the roster. Trips that reference
            them may be affected. This cannot be undone.
          </p>
          <ModalActions
            onCancel={closeDialog}
            submitLabel="Delete Driver"
            pending={remove.isPending}
            error={remove.error}
          />
        </form>
      </Modal>
    </>
  );
}

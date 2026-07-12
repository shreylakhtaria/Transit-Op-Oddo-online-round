"use client";

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  BadgeCheck,
  Plus,
  RefreshCw,
  ShieldOff,
} from "lucide-react";
import {
  Button,
  Field,
  Input,
  Panel,
  StatusPill,
  Table,
  TableFooter,
  Td,
  Th,
  type Tone,
} from "@/components/ui";
import { EmptyState, ErrorState, TableSkeleton } from "@/components/ui/async";
import { useDrivers, useCreateDriver } from "@/lib/api/hooks";
import type { Driver, DriverStatus } from "@/lib/api/types";
import { useAuth } from "@/lib/auth";

const STATUS_TONE: Record<DriverStatus, Tone> = {
  Available: "success",
  "On Trip": "warn",
  "Off Duty": "neutral",
  Suspended: "danger",
};

/** A driver is safe-flagged above this score; below it the row shows the warning glyph. */
const SAFE_SCORE = 80;

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
  const { user } = useAuth();
  const { data, isLoading, error, refetch } = useDrivers();
  const createDriver = useCreateDriver();
  const [selected, setSelected] = useState<number[]>([]);

  const isAllowed = user?.role?.name === "Fleet Manager" || user?.role?.name === "Safety Officer";

  // Add Driver Form States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [driverName, setDriverName] = useState("");
  const [licenseNo, setLicenseNo] = useState("");
  const [licenseCat, setLicenseCat] = useState("");
  const [licenseExpiry, setLicenseExpiry] = useState("");
  const [phone, setPhone] = useState("");
  const [safetyScoreVal, setSafetyScoreVal] = useState("100");
  const [errorMsg, setErrorMsg] = useState("");

  const resetForm = () => {
    setDriverName("");
    setLicenseNo("");
    setLicenseCat("");
    setLicenseExpiry("");
    setPhone("");
    setSafetyScoreVal("100");
    setErrorMsg("");
  };

  const handleAddDriver = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    createDriver.mutate({
      name: driverName,
      licenseNumber: licenseNo,
      licenseCategory: licenseCat,
      licenseExpiryDate: licenseExpiry,
      contactNumber: phone,
      safetyScore: Number(safetyScoreVal),
      status: "Available"
    }, {
      onSuccess: () => {
        resetForm();
        setIsModalOpen(false);
      },
      onError: (err) => {
        setErrorMsg(err instanceof Error ? err.message : "Failed to create driver");
      }
    });
  };

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

  const allSelected = drivers.length > 0 && selected.length === drivers.length;

  const toggleAll = () =>
    setSelected(allSelected ? [] : drivers.map((d) => d.id));

  const toggleOne = (id: number) =>
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );

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
            className="bg-surface-2 px-4 py-2 text-[13px] text-muted"
            icon={<RefreshCw className="size-3.5" />}
          >
            Toggle Status
          </Button>
          {isAllowed && (
            <Button
              className="px-5 py-2 text-[13px]"
              icon={<Plus className="size-3" strokeWidth={3} />}
              onClick={() => setIsModalOpen(true)}
            >
              Add Driver
            </Button>
          )}
        </div>
      </div>

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
                        label="Select all drivers"
                      />
                    </Th>
                    <Th className="px-3 whitespace-nowrap">Driver</Th>
                    <Th className="px-3 whitespace-nowrap">License No.</Th>
                    <Th className="px-2 whitespace-nowrap">Cat.</Th>
                    <Th className="px-3 whitespace-nowrap">Expiry</Th>
                    <Th className="px-3 whitespace-nowrap">Contact</Th>
                    <Th className="px-2 whitespace-nowrap">Safety</Th>
                    <Th className="px-3 w-[110px] whitespace-nowrap">Status</Th>
                  </tr>
                </thead>
                <tbody>
                  {drivers.map((d) => {
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
                      </tr>
                    );
                  })}
                </tbody>
              </Table>
              <TableFooter
                summary={`Showing 1-${drivers.length} of ${drivers.length} drivers`}
                pages={1}
                current={1}
              />
            </>
          )}
        </Panel>
      )}

      {/* Add Driver Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="glass w-full max-w-md p-6 rounded-xl flex flex-col gap-6 shadow-[0_0_50px_rgba(0,0,0,0.8)] border border-line">
            <h2 className="text-xl font-bold text-ink">Add New Driver</h2>
            <form onSubmit={handleAddDriver} className="flex flex-col gap-4">
              <Field label="Driver Name">
                <Input required placeholder="John Doe" value={driverName} onChange={e => setDriverName(e.target.value)} />
              </Field>
              <Field label="License Number">
                <Input required placeholder="DL-123456" value={licenseNo} onChange={e => setLicenseNo(e.target.value)} />
              </Field>
              <Field label="License Category">
                <Input required placeholder="Heavy Transport" value={licenseCat} onChange={e => setLicenseCat(e.target.value)} />
              </Field>
              <Field label="License Expiry Date">
                <Input required type="date" value={licenseExpiry} onChange={e => setLicenseExpiry(e.target.value)} className="font-mono" />
              </Field>
              <div className="flex gap-4">
                <Field label="Contact Number" className="flex-1">
                  <Input required placeholder="+919876543210" value={phone} onChange={e => setPhone(e.target.value)} />
                </Field>
                <Field label="Safety Score (0-100)" className="flex-1">
                  <Input required type="number" min="0" max="100" placeholder="100" value={safetyScoreVal} onChange={e => setSafetyScoreVal(e.target.value)} />
                </Field>
              </div>

              {errorMsg && <p className="text-sm text-danger">{errorMsg}</p>}

              <div className="flex gap-3 pt-2">
                <Button type="submit" className="flex-1 justify-center py-3 text-sm" disabled={createDriver.isPending}>
                  {createDriver.isPending ? "Adding..." : "Add Driver"}
                </Button>
                <Button variant="outline" className="flex-1 justify-center py-3 text-sm" onClick={() => { resetForm(); setIsModalOpen(false); }}>
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

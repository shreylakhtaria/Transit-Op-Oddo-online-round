"use client";

import { useState } from "react";
import {
  Ban,
  Check,
  ChevronDown,
  CircleCheck,
  Clock,
  KeyRound,
  Lock,
  Pencil,
  Plus,
  Save,
  ShieldCheck,
  SlidersHorizontal,
  Smartphone,
  Truck,
  Users,
  Wallet,
} from "lucide-react";
import {
  Button,
  Field,
  Input,
  PageHeader,
  Table,
  Td,
  Th,
  Tr,
} from "@/components/ui";
import { ErrorState, MockBadge, Skeleton } from "@/components/ui/async";
import { useSettings, useUpdateSettings } from "@/lib/api/hooks";

/* ---------- local primitives (page-scoped) ---------- */

/** Settings card — frosted glass (Layer 1), same substrate as the shared Panel. */
function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={`glass rounded-xl ${className}`}>{children}</div>;
}

function SectionIntro({
  icon,
  title,
  lines,
  badge,
}: {
  icon: React.ReactNode;
  title: string;
  lines: string[];
  badge?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2 text-accent">
        {icon}
        <h2 className="text-xl font-semibold leading-7">{title}</h2>
        {badge}
      </div>
      <p className="text-sm leading-5 text-muted">
        {lines.map((line) => (
          <span key={line} className="block">
            {line}
          </span>
        ))}
      </p>
    </div>
  );
}

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
        checked ? "bg-accent" : "bg-surface-4"
      }`}
    >
      <span
        className={`absolute top-0.5 size-5 rounded-full bg-ink transition-all ${
          checked ? "left-[22px]" : "left-0.5"
        }`}
      />
    </button>
  );
}

function Checkbox({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-3 text-sm text-ink">
      <span
        className={`flex size-[18px] shrink-0 items-center justify-center rounded transition-colors ${
          checked ? "bg-accent" : "border border-line bg-accent-faint"
        }`}
      >
        {checked && (
          <Check className="size-3.5 text-accent-ink" strokeWidth={3.5} />
        )}
      </span>
      <input
        type="checkbox"
        className="sr-only"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      {label}
    </label>
  );
}

function SecurityCard({
  icon,
  title,
  description,
  action,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <span className="flex size-10 shrink-0 items-center justify-center rounded bg-accent-dim text-accent">
            {icon}
          </span>
          <div>
            <h3 className="text-base font-bold leading-6 text-ink">{title}</h3>
            <p className="text-xs leading-4 text-muted">{description}</p>
          </div>
        </div>
        {action}
      </div>
      {children}
    </Card>
  );
}

/* ---------- RBAC ----------
   There is no user/role API — no GET /users, no GET /roles, no role assignment.
   This table therefore stays on mock data and is badged as such. */

type Role = {
  name: string;
  icon: React.ReactNode;
  visibility: string;
  ops: boolean;
  financials: boolean;
};

const MOCK_ROLES: Role[] = [
  {
    name: "Fleet Manager",
    icon: <ShieldCheck className="size-4" />,
    visibility: "Full Depot-Level View",
    ops: true,
    financials: false,
  },
  {
    name: "Dispatcher",
    icon: <Truck className="size-4" />,
    visibility: "Active Trip Queue Only",
    ops: true,
    financials: false,
  },
  {
    name: "Safety Officer",
    icon: <Users className="size-4" />,
    visibility: "Incident & Driver Logs",
    ops: false,
    financials: false,
  },
  {
    name: "Financial Analyst",
    icon: <Wallet className="size-4" />,
    visibility: "Audit & Expense Ledgers",
    ops: false,
    financials: true,
  },
];

function PermissionMark({ granted }: { granted: boolean }) {
  return granted ? (
    <CircleCheck className="mx-auto size-[18px] text-accent" />
  ) : (
    <Ban className="mx-auto size-[18px] text-muted opacity-40" />
  );
}

const PASSWORD_RULES = [
  "Require Special Characters",
  "Expire Passwords (90 Days)",
  "Min Length (12 Chars)",
  "Restrict Geo-Locations",
] as const;

/* Real settings keys exposed by GET /settings. */
const DEPOT_NAME = "DEPOT_NAME";
const CURRENCY = "CURRENCY";
const DISTANCE_UNIT = "DISTANCE_UNIT";

export default function SettingsPage() {
  const { data, isLoading, error, refetch } = useSettings();
  const updateSettings = useUpdateSettings();

  // Edits live in a draft overlay; anything untouched falls through to the
  // server value, so no effect is needed to seed the form.
  const [draft, setDraft] = useState<Record<string, string>>({});
  const field = (key: string, fallback = "") =>
    draft[key] ?? data?.[key] ?? fallback;
  const setField = (key: string, value: string) =>
    setDraft((d) => ({ ...d, [key]: value }));

  const depotName = field(DEPOT_NAME);
  const currency = field(CURRENCY);
  const distanceUnit = field(DISTANCE_UNIT, "Kilometers");

  // Security & password-policy controls have no endpoints — inert local state.
  const [twoFactor, setTwoFactor] = useState(true);
  const [rules, setRules] = useState<Record<string, boolean>>({
    "Require Special Characters": true,
    "Expire Passwords (90 Days)": true,
    "Min Length (12 Chars)": true,
    "Restrict Geo-Locations": false,
  });

  const commit = () => {
    updateSettings.mutate({
      [DEPOT_NAME]: depotName,
      [CURRENCY]: currency,
      [DISTANCE_UNIT]: distanceUnit,
    });
  };

  const commitLabel = updateSettings.isPending
    ? "Committing…"
    : updateSettings.isSuccess
      ? "Saved"
      : "Commit Changes";

  return (
    <>
      <div className="flex flex-col gap-8">
        <PageHeader
          crumbs={["Settings", "Administration"]}
          title="Settings & Administration"
          subtitle="Configure global operational parameters, define organizational hierarchy, and manage role-based access controls for the Gandhinagar Depot ecosystem."
          action={
            <Button
              className="shrink-0 whitespace-nowrap"
              onClick={commit}
              disabled={isLoading || !!error || updateSettings.isPending}
              icon={<Save className="size-3.5 shrink-0" strokeWidth={3} />}
            >
              {commitLabel}
            </Button>
          }
        />
        <div className="h-px w-full bg-gradient-to-r from-accent/30 to-transparent" />
      </div>

      {/* Section 1 — General Depot Settings (live: GET/PUT /settings) */}
      <section className="grid grid-cols-3 gap-8">
        <SectionIntro
          icon={<SlidersHorizontal className="size-5" />}
          title="General Depot Settings"
          lines={[
            "Core configuration for the physical terminal",
            "location and localized data formats.",
          ]}
        />
        {error ? (
          <div className="col-span-2">
            <ErrorState error={error} onRetry={() => refetch()} />
          </div>
        ) : (
          <Card className="col-span-2 p-8">
            {isLoading ? (
              <div className="grid grid-cols-2 gap-6">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex flex-col gap-1.5">
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-11 w-full" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-6">
                <Field label="Depot Name">
                  <Input
                    value={depotName}
                    onChange={(e) => setField(DEPOT_NAME, e.target.value)}
                  />
                </Field>
                <Field label="Currency">
                  <Input
                    value={currency}
                    onChange={(e) => setField(CURRENCY, e.target.value)}
                    icon={<Wallet className="size-4" />}
                  />
                </Field>
                <Field label="Measurement Units">
                  <div className="flex gap-1 rounded-lg border border-line bg-accent-faint p-1.5">
                    {(
                      [
                        ["Kilometers", "METRIC (KM)"],
                        ["Miles", "IMPERIAL (MI)"],
                      ] as const
                    ).map(([key, text]) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setField(DISTANCE_UNIT, key)}
                        className={`flex-1 rounded py-2 text-xs font-bold leading-4 transition-colors ${
                          distanceUnit === key
                            ? "bg-accent text-accent-ink"
                            : "text-muted hover:text-ink"
                        }`}
                      >
                        {text}
                      </button>
                    ))}
                  </div>
                </Field>
              </div>
            )}

            {updateSettings.isError && (
              <p className="pt-4 text-sm text-danger">
                Couldn&apos;t save settings:{" "}
                {updateSettings.error instanceof Error
                  ? updateSettings.error.message
                  : "Unknown error."}
              </p>
            )}
            {updateSettings.isSuccess && (
              <p className="pt-4 text-sm text-success">Settings saved.</p>
            )}
          </Card>
        )}
      </section>

      {/* Section 2 — RBAC (no endpoint; mock) */}
      <section className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <SectionIntro
            icon={<KeyRound className="size-5" />}
            title="Role-Based Access Control (RBAC)"
            badge={<MockBadge reason="No user/role API yet" />}
            lines={[
              "Manage granular permissions and visibility layers across the organization.",
            ]}
          />
          <button
            type="button"
            className="flex items-center gap-2 rounded bg-surface-4 px-4 py-2 text-base text-ink transition hover:opacity-90"
          >
            <Plus className="size-3.5" strokeWidth={3} />
            Define New Role
          </button>
        </div>

        <Card className="overflow-hidden">
          <Table>
            <thead>
              <tr>
                <Th>Role Name</Th>
                <Th>Data Visibility</Th>
                <Th>Ops Control</Th>
                <Th>Financials</Th>
                <Th>Status</Th>
                <Th align="right">Action</Th>
              </tr>
            </thead>
            <tbody>
              {MOCK_ROLES.map((role) => (
                <Tr key={role.name}>
                  <Td>
                    <span className="flex items-center gap-3">
                      <span className="text-accent">{role.icon}</span>
                      <span className="font-bold text-ink">{role.name}</span>
                    </span>
                  </Td>
                  <Td>{role.visibility}</Td>
                  <Td className="text-center">
                    <PermissionMark granted={role.ops} />
                  </Td>
                  <Td className="text-center">
                    <PermissionMark granted={role.financials} />
                  </Td>
                  <Td>
                    <span className="label-eyebrow inline-flex rounded-full bg-accent-dim px-3 py-0.5 font-black text-accent">
                      Active
                    </span>
                  </Td>
                  <Td align="right">
                    <button
                      type="button"
                      aria-label={`Edit ${role.name}`}
                      className="text-muted transition hover:text-accent"
                    >
                      <Pencil className="ml-auto size-4" />
                    </button>
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        </Card>
      </section>

      {/* Section 3 — Security & Auth (no endpoints; inert local state) */}
      <section className="grid grid-cols-3 gap-8">
        <SectionIntro
          icon={<Lock className="size-5" />}
          title="Security & Auth"
          badge={<MockBadge reason="No security/auth settings API yet" />}
          lines={[
            "System-wide authentication protocols and",
            "infrastructure security constraints.",
          ]}
        />

        <div className="col-span-2 flex flex-col gap-4">
          <SecurityCard
            icon={<Smartphone className="size-5" />}
            title="Enforce Two-Factor Authentication (2FA)"
            description="Require all administrative accounts to use a secondary authentication layer."
            action={
              <Toggle
                checked={twoFactor}
                onChange={setTwoFactor}
                label="Enforce Two-Factor Authentication"
              />
            }
          />

          <SecurityCard
            icon={<Clock className="size-5" />}
            title="Session Inactivity Timeout"
            description="Automatically terminate inactive sessions after a set duration."
            action={
              <div className="relative flex items-center">
                <select
                  aria-label="Session inactivity timeout"
                  defaultValue="30 Minutes"
                  className="appearance-none rounded border border-line bg-surface-3 py-2 pl-4 pr-9 text-xs font-bold text-ink backdrop-blur-[24px] outline-none focus:border-accent/45 focus:shadow-[0_0_24px_rgba(125,211,252,0.15)]"
                >
                  {["15 Minutes", "30 Minutes", "60 Minutes", "Never"].map(
                    (o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ),
                  )}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 size-4 text-muted" />
              </div>
            }
          />

          <SecurityCard
            icon={<KeyRound className="size-5" />}
            title="Advanced Password Policy"
            description="Define complexity requirements for operator credentials."
          >
            <div className="mt-6 grid grid-cols-2 gap-4">
              {PASSWORD_RULES.map((rule) => (
                <Checkbox
                  key={rule}
                  label={rule}
                  checked={rules[rule]}
                  onChange={(v) => setRules((r) => ({ ...r, [rule]: v }))}
                />
              ))}
            </div>
          </SecurityCard>
        </div>
      </section>
    </>
  );
}

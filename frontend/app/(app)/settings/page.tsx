"use client";

import { useMemo, useState } from "react";
import {
  Check,
  ChevronDown,
  Clock,
  HardHat,
  KeyRound,
  Lock,
  Save,
  ShieldCheck,
  SlidersHorizontal,
  Smartphone,
  Truck,
  UserCog,
  Users,
  Wallet,
} from "lucide-react";
import {
  Button,
  Field,
  Input,
  PageHeader,
  Select,
  Table,
  Td,
  Th,
  Tr,
} from "@/components/ui";
import {
  EmptyState,
  ErrorState,
  MockBadge,
  Skeleton,
  TableSkeleton,
} from "@/components/ui/async";
import { ApiError } from "@/lib/api/client";
import { useAuth } from "@/lib/auth";
import {
  useRoles,
  useSettings,
  useUpdateSettings,
  useUpdateUserRole,
  useUsers,
} from "@/lib/api/hooks";

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
   The `Roles` table holds only an id and a name. Permissions are not data —
   they live in the API's route guards — so there is no permission matrix to
   render, and inventing one here would be a lie. What is real: the role list
   (+ its user counts) and which user sits in which role. That is what we show. */

const ROLE_ICONS: Record<string, React.ReactNode> = {
  "Fleet Manager": <ShieldCheck className="size-4" />,
  Driver: <Truck className="size-4" />,
  "Safety Officer": <HardHat className="size-4" />,
  "Financial Analyst": <Wallet className="size-4" />,
};

const roleIcon = (name: string) => ROLE_ICONS[name] ?? <Users className="size-4" />;

/** Placeholder option for a user the API reports with `role: null`. */
const UNASSIGNED = "Unassigned";

/**
 * GET /users is Fleet Manager only. Everyone else gets a 403 — that is the
 * access control doing its job, so it renders as a calm note, not an error.
 */
function UserAdmin({ roleNames }: { roleNames: string[] }) {
  const { data, isLoading, error, refetch } = useUsers();
  const updateRole = useUpdateUserRole();

  const users = data ?? [];

  if (error instanceof ApiError && error.status === 403) {
    return (
      <Card className="flex items-center gap-3 px-6 py-5">
        <Lock className="size-4 shrink-0 text-muted" />
        <p className="text-sm leading-5 text-muted">
          User administration is restricted to Fleet Managers. The roles above
          are visible to everyone; the people assigned to them are not.
        </p>
      </Card>
    );
  }

  if (error) return <ErrorState error={error} onRetry={() => refetch()} />;

  return (
    <Card className="overflow-hidden">
      {isLoading ? (
        <TableSkeleton cols={4} />
      ) : users.length === 0 ? (
        <EmptyState
          title="No users yet"
          hint="Accounts that register against this depot will appear here."
        />
      ) : (
        <Table>
          <thead>
            <tr>
              {/* px-2 + a w-36 select is what keeps all four columns inside the
                  panel at 960px instead of pushing them into a scroll. */}
              <Th className="px-2 whitespace-nowrap">Name</Th>
              <Th className="px-2 whitespace-nowrap">Email</Th>
              <Th className="px-2 whitespace-nowrap">Current Role</Th>
              <Th align="right" className="px-2 whitespace-nowrap">
                Reassign Role
              </Th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => {
              // One mutation serves every row, so `variables` says which row is
              // the one actually in flight / failed.
              const target = updateRole.variables?.id === u.id;
              const pending = target && updateRole.isPending;
              const failed = target && updateRole.isError;
              const saved = target && updateRole.isSuccess;
              const current = u.role?.name ?? UNASSIGNED;
              // A failed reassignment leaves the select on the server's value —
              // it is controlled by `current`, so it snaps back on its own.
              const options = u.role ? roleNames : [UNASSIGNED, ...roleNames];

              return (
                <Tr key={u.id}>
                  {/* The one column allowed to wrap — it absorbs the squeeze at
                      960px so the select never leaves the panel. */}
                  <Td className="px-2 text-sm font-bold text-ink">{u.name}</Td>
                  <Td className="px-2 whitespace-nowrap text-sm text-muted">
                    {u.email}
                  </Td>
                  <Td className="px-2">
                    <span className="flex items-center gap-2 whitespace-nowrap text-sm text-ink">
                      <span className="text-accent">{roleIcon(current)}</span>
                      {current}
                    </span>
                  </Td>
                  <Td align="right" className="px-2">
                    <div className="flex flex-col items-end gap-1.5">
                      <Select
                        aria-label={`Role for ${u.name}`}
                        options={options}
                        value={current}
                        disabled={pending || roleNames.length === 0}
                        onChange={(e) => {
                          const roleName = e.target.value;
                          if (roleName === UNASSIGNED || roleName === current)
                            return;
                          updateRole.mutate({ id: u.id, roleName });
                        }}
                        className="w-36 disabled:opacity-60"
                      />
                      {pending && (
                        <span className="text-xs text-muted">Saving…</span>
                      )}
                      {saved && (
                        <span className="text-xs text-success">
                          Role updated.
                        </span>
                      )}
                      {/* e.g. the API refuses to demote the last Fleet Manager —
                          show its reason verbatim rather than a generic failure. */}
                      {failed && (
                        <span className="max-w-[280px] text-right text-xs leading-4 text-danger">
                          {updateRole.error instanceof Error
                            ? updateRole.error.message
                            : "Couldn't update this role."}
                        </span>
                      )}
                    </div>
                  </Td>
                </Tr>
              );
            })}
          </tbody>
        </Table>
      )}
    </Card>
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
  const { user } = useAuth();
  const isManager = user?.role?.name === "Fleet Manager";
  const { data, isLoading, error, refetch } = useSettings();
  const updateSettings = useUpdateSettings();

  const {
    data: rolesData,
    isLoading: rolesLoading,
    error: rolesError,
    refetch: refetchRoles,
  } = useRoles();

  const roles = useMemo(() => rolesData ?? [], [rolesData]);
  // The assignable roles are whatever the API says they are — not a hardcoded list.
  const roleNames = useMemo(() => roles.map((r) => r.name), [roles]);

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
            isManager ? (
              <Button
                className="shrink-0 whitespace-nowrap"
                onClick={commit}
                disabled={isLoading || !!error || updateSettings.isPending}
                icon={<Save className="size-3.5 shrink-0" strokeWidth={3} />}
              >
                {commitLabel}
              </Button>
            ) : undefined
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
                    disabled={!isManager}
                    onChange={(e) => setField(DEPOT_NAME, e.target.value)}
                  />
                </Field>
                <Field label="Currency">
                  <Input
                    value={currency}
                    disabled={!isManager}
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
                        disabled={!isManager}
                        onClick={() => setField(DISTANCE_UNIT, key)}
                        className={`flex-1 rounded py-2 text-xs font-bold leading-4 transition-colors disabled:opacity-50 ${
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

      {/* Section 2 — RBAC (live: GET /roles, GET+PATCH /users) */}
      <section className="flex flex-col gap-6">
        <SectionIntro
          icon={<KeyRound className="size-5" />}
          title="Role-Based Access Control (RBAC)"
          lines={[
            "Roles are defined by the API and enforced in its route guards — they are not",
            "an editable permission matrix. Move a person between roles to change their access.",
          ]}
        />

        {rolesError ? (
          <ErrorState error={rolesError} onRetry={() => refetchRoles()} />
        ) : (
          <Card className="overflow-hidden">
            {rolesLoading ? (
              <TableSkeleton cols={2} rows={4} />
            ) : roles.length === 0 ? (
              <EmptyState
                title="No roles defined"
                hint="The API returned an empty role list."
              />
            ) : (
              <Table>
                <thead>
                  <tr>
                    <Th className="px-3 whitespace-nowrap">Role Name</Th>
                    <Th align="right" className="px-3 whitespace-nowrap">
                      Users
                    </Th>
                  </tr>
                </thead>
                <tbody>
                  {roles.map((role) => (
                    <Tr key={role.id}>
                      <Td className="px-3">
                        <span className="flex items-center gap-3">
                          <span className="text-accent">
                            {roleIcon(role.name)}
                          </span>
                          <span className="whitespace-nowrap font-bold text-ink">
                            {role.name}
                          </span>
                        </span>
                      </Td>
                      <Td align="right" mono className="px-3 text-ink">
                        {role.userCount}
                      </Td>
                    </Tr>
                  ))}
                </tbody>
              </Table>
            )}
          </Card>
        )}

        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-2 text-accent">
            <UserCog className="size-4" />
            <h3 className="text-base font-bold leading-6">
              Users &amp; Assignments
            </h3>
          </div>
          <span className="rounded bg-surface-2 px-2 py-1 text-xs text-muted">
            Fleet Managers only
          </span>
        </div>

        <UserAdmin roleNames={roleNames} />
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

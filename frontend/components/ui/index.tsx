import type { ReactNode } from "react";

/** Panel — frosted glass with a thin luminous border (Layer 1). */
export function Panel({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={`glass rounded-xl ${className}`}>{children}</div>;
}

export function PanelHeader({
  title,
  icon,
  action,
}: {
  title: string;
  icon?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between border-b border-line-soft px-6 py-4">
      <div className="flex items-center gap-2">
        {icon}
        <h2 className="text-base font-bold text-ink">{title}</h2>
      </div>
      {action}
    </div>
  );
}

/** Breadcrumb + title + subtitle block at the top of each page. */
export function PageHeader({
  crumbs,
  title,
  subtitle,
  action,
}: {
  crumbs: string[];
  title: string;
  subtitle: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-end justify-between gap-6">
      <div className="flex min-w-0 flex-col gap-1">
        <nav className="flex gap-2">
          {crumbs.map((crumb, i) => (
            <span key={crumb} className="contents">
              {i > 0 && <span className="label-eyebrow">/</span>}
              <span
                className={
                  i === crumbs.length - 1
                    ? "label-eyebrow text-accent"
                    : "label-eyebrow"
                }
              >
                {crumb}
              </span>
            </span>
          ))}
        </nav>
        <h1 className="pt-1 text-2xl font-semibold leading-8 text-ink">
          {title}
        </h1>
        <p className="text-base text-muted">{subtitle}</p>
      </div>
      {action}
    </div>
  );
}

type ButtonProps = {
  children: ReactNode;
  icon?: ReactNode;
  variant?: "primary" | "ghost" | "outline";
  className?: string;
} & React.ButtonHTMLAttributes<HTMLButtonElement>;

export function Button({
  children,
  icon,
  variant = "primary",
  className = "",
  ...props
}: ButtonProps) {
  // Glass buttons: translucent primary fill + luminous border, deepening on hover.
  const styles = {
    primary:
      "border border-accent/40 bg-accent/15 text-accent backdrop-blur-[16px] hover:bg-accent/25 hover:shadow-[0_0_24px_rgba(125,211,252,0.15)]",
    outline:
      "border border-line bg-surface text-ink backdrop-blur-[16px] hover:border-accent/40 hover:bg-accent/10",
    ghost: "text-muted hover:text-accent",
  }[variant];

  return (
    <button
      type="button"
      className={`flex items-center gap-2 rounded px-6 py-2.5 text-base font-bold transition ${styles} ${className}`}
      {...props}
    >
      {icon}
      {children}
    </button>
  );
}

const TONES = {
  success: "border border-success/25 bg-success-dim text-success",
  warn: "border border-accent/25 bg-accent-dim text-accent",
  danger: "border border-danger/25 bg-danger-dim text-danger",
  neutral: "border border-tertiary/25 bg-tertiary-dim text-tertiary",
} as const;

export type Tone = keyof typeof TONES;

/** Status pill — Available / On Trip / In Shop / Retired, etc. */
export function StatusPill({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: Tone;
}) {
  return (
    <span
      className={`inline-flex items-center rounded px-2 py-0.5 text-sm ${TONES[tone]}`}
    >
      {children}
    </span>
  );
}

export function Field({
  label,
  children,
  className = "",
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <span className="label-field">{label}</span>
      {children}
    </div>
  );
}

export function Select({
  options,
  className = "",
  ...props
}: {
  options: string[];
} & React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={`rounded-lg border border-line bg-surface px-3 py-2.5 text-sm text-ink backdrop-blur-[16px] outline-none focus:border-accent/45 focus:shadow-[0_0_24px_rgba(125,211,252,0.15)] ${className}`}
      {...props}
    >
      {options.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  );
}

export function Input({
  icon,
  className = "",
  ...props
}: { icon?: ReactNode } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="relative flex w-full items-center">
      {icon && (
        <span className="absolute left-3 flex items-center text-placeholder">
          {icon}
        </span>
      )}
      <input
        className={`w-full rounded-lg border border-line bg-surface py-2.5 text-sm text-ink backdrop-blur-[16px] outline-none placeholder:text-placeholder focus:border-accent/45 focus:shadow-[0_0_24px_rgba(125,211,252,0.15)] ${
          icon ? "pl-10 pr-4" : "px-4"
        } ${className}`}
        {...props}
      />
    </div>
  );
}

/** Table primitives — shared column rhythm across Fleet, Drivers, Maintenance, Fuel. */
export function Table({ children }: { children: ReactNode }) {
  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full border-collapse text-left">{children}</table>
    </div>
  );
}

/**
 * Cells default to `px-6`, but dense tables can pass their own `px-*`/`p-*` in
 * `className` — the default is dropped so the two never fight in the cascade.
 */
const paddingX = (className: string) =>
  /(^|\s)(px|p)-/.test(className) ? "" : "px-6";

export function Th({
  children,
  align = "left",
  className = "",
}: {
  children: ReactNode;
  align?: "left" | "right";
  className?: string;
}) {
  return (
    <th
      className={`label-field glass-elevated ${paddingX(className)} py-4 font-bold ${
        align === "right" ? "text-right" : "text-left"
      } ${className}`}
    >
      {children}
    </th>
  );
}

export function Td({
  children,
  align = "left",
  mono = false,
  className = "",
}: {
  children: ReactNode;
  align?: "left" | "right";
  mono?: boolean;
  className?: string;
}) {
  return (
    <td
      className={`${paddingX(className)} py-5 text-base ${
        align === "right" ? "text-right" : ""
      } ${mono ? "font-mono" : ""} ${className}`}
    >
      {children}
    </td>
  );
}

export function Tr({ children }: { children: ReactNode }) {
  return (
    <tr className="border-t border-line-soft transition-colors hover:bg-white/[0.02]">
      {children}
    </tr>
  );
}

/** Footer strip with "showing x of y" + pagination, used under every data table. */
export function TableFooter({
  summary,
  pages = 3,
  current = 1,
}: {
  summary: string;
  pages?: number;
  current?: number;
}) {
  return (
    <div className="glass-elevated flex items-center justify-between border-t border-line-soft px-6 py-3">
      <p className="label-field uppercase">{summary}</p>
      <div className="flex gap-2">
        <button
          type="button"
          className="flex size-8 items-center justify-center rounded border border-line text-xs text-ink opacity-30"
          disabled
        >
          ‹
        </button>
        {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
          <button
            key={p}
            type="button"
            className={`flex size-8 items-center justify-center rounded border text-xs font-bold transition ${
              p === current
                ? "border-accent/40 bg-accent/20 text-accent shadow-[0_0_20px_rgba(125,211,252,0.15)]"
                : "border-line text-ink hover:border-accent/30 hover:bg-accent/10"
            }`}
          >
            {p}
          </button>
        ))}
        <button
          type="button"
          className="flex size-8 items-center justify-center rounded border border-line text-xs text-ink"
        >
          ›
        </button>
      </div>
    </div>
  );
}

/** The bottom "policy" note with an info icon, present on most screens. */
export function RuleNote({
  icon,
  children,
}: {
  icon?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 border-t border-line-soft pt-6 opacity-80">
      {icon}
      <p className="text-sm text-muted">{children}</p>
    </div>
  );
}

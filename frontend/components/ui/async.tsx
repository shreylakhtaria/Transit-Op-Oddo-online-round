"use client";

import type { ReactNode } from "react";
import { AlertTriangle, Inbox, RefreshCw } from "lucide-react";
import { Panel } from "./index";

/** Shimmering glass placeholder — used while a query is in flight. */
export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-md bg-accent/10 ${className}`}
      aria-hidden
    />
  );
}

export function TableSkeleton({
  rows = 5,
  cols = 6,
}: {
  rows?: number;
  cols?: number;
}) {
  return (
    <div className="flex flex-col gap-3 p-6">
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-4">
          {Array.from({ length: cols }).map((_, c) => (
            <Skeleton key={c} className="h-5 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}

export function ErrorState({
  error,
  onRetry,
}: {
  error: unknown;
  onRetry?: () => void;
}) {
  const message =
    error instanceof Error ? error.message : "Something went wrong.";
  return (
    <Panel className="flex flex-col items-center gap-3 px-6 py-12 text-center">
      <AlertTriangle className="size-7 text-danger" />
      <p className="text-base font-semibold text-ink">Couldn&apos;t load data</p>
      <p className="max-w-md text-sm text-muted">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-2 flex items-center gap-2 rounded-lg border border-accent/40 bg-accent/15 px-4 py-2 text-sm font-semibold text-accent transition hover:bg-accent/25"
        >
          <RefreshCw className="size-4" />
          Retry
        </button>
      )}
    </Panel>
  );
}

export function EmptyState({
  title,
  hint,
  icon,
}: {
  title: string;
  hint?: string;
  icon?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-2 px-6 py-16 text-center">
      {icon ?? <Inbox className="size-7 text-muted" />}
      <p className="text-base font-semibold text-ink">{title}</p>
      {hint && <p className="max-w-md text-sm text-muted">{hint}</p>}
    </div>
  );
}

/** Marks UI that has no backing endpoint yet, so mock data is never mistaken for real. */
export function MockBadge({ reason }: { reason: string }) {
  return (
    <span
      title={reason}
      className="inline-flex items-center rounded border border-tertiary/25 bg-tertiary-dim px-2 py-0.5 text-[10px] font-bold uppercase tracking-[1px] text-tertiary"
    >
      Mock data
    </span>
  );
}

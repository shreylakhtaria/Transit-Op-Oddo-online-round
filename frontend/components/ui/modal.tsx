"use client";

import { useEffect, type ReactNode } from "react";
import { X, Loader2 } from "lucide-react";

/**
 * Glass dialog used by every "create/edit" action. Deliberately not a <dialog> —
 * the Glacier look needs a blurred backdrop over the aurora, which ::backdrop can't do.
 */
export function Modal({
  open,
  onClose,
  title,
  subtitle,
  icon,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  children: ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    // Stop the page behind the dialog from scrolling under it.
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-bg/70 backdrop-blur-[6px]"
      />

      <div className="glass relative z-10 max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-xl p-6">
        <div className="flex items-start justify-between gap-4 pb-5">
          <div className="flex items-start gap-3">
            {icon && <span className="mt-0.5 text-accent">{icon}</span>}
            <div>
              <h2 className="text-lg font-semibold text-ink">{title}</h2>
              {subtitle && (
                <p className="pt-1 text-sm text-muted">{subtitle}</p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="rounded-lg p-1 text-muted transition hover:bg-white/5 hover:text-ink"
          >
            <X className="size-4" />
          </button>
        </div>

        {children}
      </div>
    </div>
  );
}

/** Cancel + submit pair, with the pending state and the API's error message inline. */
export function ModalActions({
  onCancel,
  submitLabel,
  pending,
  error,
  disabled,
}: {
  onCancel: () => void;
  submitLabel: string;
  pending?: boolean;
  error?: unknown;
  disabled?: boolean;
}) {
  const message =
    error instanceof Error ? error.message : error ? String(error) : null;

  return (
    <>
      {message && (
        <p className="mt-5 rounded-lg border border-danger/30 bg-danger-dim px-3 py-2 text-sm text-danger">
          {message}
        </p>
      )}
      <div className="mt-6 flex gap-3">
        <button
          type="submit"
          disabled={pending || disabled}
          className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-accent/40 bg-accent/15 py-2.5 text-sm font-bold text-accent backdrop-blur-[16px] transition hover:bg-accent/25 hover:shadow-[0_0_24px_rgba(125,211,252,0.15)] disabled:cursor-not-allowed disabled:opacity-40"
        >
          {pending && <Loader2 className="size-4 animate-spin" />}
          {pending ? "Saving…" : submitLabel}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-line px-5 py-2.5 text-sm font-bold text-muted transition hover:bg-white/5 hover:text-ink"
        >
          Cancel
        </button>
      </div>
    </>
  );
}

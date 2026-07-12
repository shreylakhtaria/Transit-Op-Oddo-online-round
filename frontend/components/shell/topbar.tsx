"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Bell, CircleHelp, LogOut, BellOff } from "lucide-react";
import { useAuth } from "@/lib/auth";

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

const DEMO_LOGINS = [
  { role: "Fleet Manager", email: "manager@transitops.com" },
  { role: "Driver", email: "driver@transitops.com" },
  { role: "Safety Officer", email: "safety@transitops.com" },
  { role: "Financial Analyst", email: "finance@transitops.com" },
];

export function Topbar({
  searchPlaceholder = "Search vehicles, drivers, trips…",
}: {
  searchPlaceholder?: string;
}) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [query, setQuery] = useState("");
  // There's no notifications or help API, so these are self-contained popovers.
  const [open, setOpen] = useState<"bell" | "help" | null>(null);

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-line bg-surface px-8 backdrop-blur-[24px]">
      {/* No global-search endpoint exists, so search routes to the Fleet registry —
          the primary searchable list — rather than pretending to search everything. */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          router.push("/fleet");
        }}
        className="glow-focus flex w-96 items-center gap-2 rounded-full border border-line bg-surface px-4 py-2 backdrop-blur-[16px] transition"
      >
        <Search className="size-[15px] shrink-0 text-muted" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={searchPlaceholder}
          className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-placeholder"
        />
      </form>

      <div className="flex items-center gap-6">
        <div className="relative flex items-center gap-4 border-r border-line pr-6">
          <button
            type="button"
            className="relative"
            aria-label="Notifications"
            aria-expanded={open === "bell"}
            onClick={() => setOpen((o) => (o === "bell" ? null : "bell"))}
          >
            <Bell className="size-5 text-muted transition hover:text-ink" />
            <span className="absolute -right-0.5 -top-0.5 size-2 rounded-full bg-accent" />
          </button>
          <button
            type="button"
            aria-label="Help"
            aria-expanded={open === "help"}
            onClick={() => setOpen((o) => (o === "help" ? null : "help"))}
          >
            <CircleHelp className="size-5 text-muted transition hover:text-ink" />
          </button>

          {open && (
            <>
              <button
                type="button"
                aria-label="Close"
                tabIndex={-1}
                className="fixed inset-0 z-10 cursor-default"
                onClick={() => setOpen(null)}
              />
              <div className="glass absolute right-0 top-10 z-20 w-72 rounded-xl p-4">
                {open === "bell" ? (
                  <div className="flex flex-col items-center gap-2 py-4 text-center">
                    <BellOff className="size-6 text-muted" />
                    <p className="text-sm font-semibold text-ink">
                      You&apos;re all caught up
                    </p>
                    <p className="text-xs text-muted">No new notifications.</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    <p className="label-eyebrow">Demo logins · password123</p>
                    <ul className="flex flex-col gap-2">
                      {DEMO_LOGINS.map((l) => (
                        <li key={l.email} className="flex flex-col">
                          <span className="text-xs font-bold text-ink">
                            {l.role}
                          </span>
                          <span className="font-mono text-[11px] text-muted">
                            {l.email}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* The signed-in operator, from GET /auth/me — not a placeholder. */}
          <div className="text-right">
            <p className="text-[11px] font-bold leading-[11px] tracking-[0.55px] text-ink">
              {user?.name ?? "—"}
            </p>
            <p className="text-[10px] font-bold uppercase leading-[15px] tracking-[-0.5px] text-muted">
              {user?.role?.name ?? "—"}
            </p>
          </div>
          <div className="flex size-10 items-center justify-center rounded-full border-2 border-accent/50 p-1 shadow-[0_0_20px_rgba(125,211,252,0.15)]">
            <div className="flex size-full items-center justify-center rounded-full bg-surface-4 text-xs font-bold text-accent">
              {user ? initials(user.name) : "··"}
            </div>
          </div>
          <button
            type="button"
            onClick={logout}
            aria-label="Sign out"
            title="Sign out"
            className="ml-1 rounded-lg border border-transparent p-2 text-muted transition hover:border-danger/30 hover:bg-danger-dim hover:text-danger"
          >
            <LogOut className="size-4" />
          </button>
        </div>
      </div>
    </header>
  );
}

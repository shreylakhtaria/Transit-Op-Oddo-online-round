"use client";

import { Search, Bell, CircleHelp, LogOut } from "lucide-react";
import { useAuth } from "@/lib/auth";

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

export function Topbar({
  searchPlaceholder = "Global system search...",
}: {
  searchPlaceholder?: string;
}) {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-line bg-surface px-8 backdrop-blur-[24px]">
      <div className="glow-focus flex w-96 items-center gap-2 rounded-full border border-line bg-surface px-4 py-2 backdrop-blur-[16px] transition">
        <Search className="size-[15px] shrink-0 text-muted" />
        <input
          type="search"
          placeholder={searchPlaceholder}
          className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-placeholder"
        />
      </div>

      <div className="flex items-center gap-6">
        <div className="flex items-center gap-4 border-r border-line pr-6">
          <button type="button" className="relative" aria-label="Notifications">
            <Bell className="size-5 text-muted" />
            <span className="absolute -right-0.5 -top-0.5 size-2 rounded-full bg-accent" />
          </button>
          <button type="button" aria-label="Help">
            <CircleHelp className="size-5 text-muted" />
          </button>
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

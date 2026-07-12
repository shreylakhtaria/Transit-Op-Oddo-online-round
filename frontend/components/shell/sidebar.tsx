"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Truck, Siren } from "lucide-react";
import { NAV_ITEMS } from "@/lib/nav";

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-30 flex w-64 flex-col justify-between border-r border-line bg-surface px-4 py-6 backdrop-blur-[16px]">
      <div className="flex items-center gap-3 px-2 pb-10">
        <div className="flex size-8 items-center justify-center rounded border border-accent/40 bg-accent/20 shadow-[0_0_20px_rgba(125,211,252,0.15)]">
          <Truck className="size-4 text-accent" strokeWidth={2.5} />
        </div>
        <div>
          <p className="text-xl font-bold leading-[25px] text-accent">
            TransitOps
          </p>
          <p className="label-eyebrow">Mission Control</p>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-1">
        {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={
                active
                  ? "flex items-center gap-3 rounded-lg border border-accent/25 border-r-2 border-r-accent bg-accent-dim py-2.5 pl-3 pr-3.5 text-sm text-accent shadow-[0_0_20px_rgba(125,211,252,0.08)]"
                  : "flex items-center gap-3 rounded-lg border border-transparent px-3 py-2.5 text-sm text-muted transition-colors hover:border-accent/15 hover:bg-accent-faint hover:text-ink"
              }
            >
              <Icon className="size-[18px] shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      <button
        type="button"
        className="flex w-full items-center justify-center gap-2 rounded-lg border border-danger/35 bg-emergency px-4 py-3 text-base font-bold text-emergency-ink backdrop-blur-[16px] transition hover:bg-danger/25 hover:shadow-[0_0_24px_rgba(251,113,133,0.2)]"
      >
        <Siren className="size-4" />
        Emergency Dispatch
      </button>
    </aside>
  );
}

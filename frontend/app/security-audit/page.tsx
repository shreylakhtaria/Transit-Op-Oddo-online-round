import Link from "next/link";
import { ArrowLeft, BadgeCheck, ShieldAlert, ShieldCheck } from "lucide-react";

const findings = [
  "Authentication is enforced through JWT-based sessions and role-aware guards.",
  "Account lockouts and OTP verification reduce credential abuse risk.",
  "Sensitive actions are routed through protected backend modules and middleware.",
];

const controls = [
  { label: "Access control", value: "RBAC + authenticated routes" },
  { label: "Session security", value: "Short-lived access tokens and refresh rotation" },
  { label: "Abuse prevention", value: "Rate limiting and account lockout logic" },
];

export default function SecurityAuditPage() {
  return (
    <main className="min-h-screen px-6 py-8 lg:px-10">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-5xl flex-col gap-6">
        <Link href="/login" className="label-field inline-flex w-fit items-center gap-2 hover:text-ink">
          <ArrowLeft className="size-3.5" />
          Back to login
        </Link>

        <section className="glass relative overflow-hidden rounded-3xl p-8 lg:p-12">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(125,211,252,0.1),transparent_42%),radial-gradient(circle_at_15%_20%,rgba(200,160,240,0.1),transparent_40%)]" />
          <div className="relative flex flex-col gap-8">
            <div className="flex items-center gap-3">
              <span className="flex size-12 items-center justify-center rounded-2xl border border-line-soft bg-accent-faint text-accent">
                <ShieldCheck className="size-5" />
              </span>
              <div>
                <p className="label-eyebrow">Official Platform Review</p>
                <h1 className="text-3xl font-semibold tracking-[-0.04em] text-ink lg:text-5xl">
                  Security Audit Overview
                </h1>
              </div>
            </div>

            <p className="max-w-3xl text-sm leading-6 text-muted lg:text-base">
              This overview summarizes the core security controls implemented in
              TransitOps so the login experience feels like a proper production
              application entry point.
            </p>

            <div className="grid gap-4 lg:grid-cols-3">
              {controls.map((control) => (
                <article key={control.label} className="glass-elevated rounded-2xl border border-line-soft p-5">
                  <p className="label-eyebrow mb-2">{control.label}</p>
                  <h2 className="text-base font-semibold text-ink">{control.value}</h2>
                </article>
              ))}
            </div>

            <div className="rounded-2xl border border-line-soft bg-surface-2 p-5">
              <div className="mb-3 flex items-center gap-2 text-ink">
                <ShieldAlert className="size-4 text-warn" />
                <span className="text-sm font-semibold">Review highlights</span>
              </div>
              <ul className="space-y-2 text-sm leading-6 text-muted">
                {findings.map((finding) => (
                  <li key={finding} className="flex gap-2">
                    <BadgeCheck className="mt-0.5 size-4 shrink-0 text-success" />
                    <span>{finding}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
import Link from "next/link";
import { ShieldCheck, Lock, Eye, ArrowLeft } from "lucide-react";

const sections = [
  {
    title: "What we collect",
    body:
      "TransitOps only collects the information required to authenticate users, operate the platform, and keep fleet workflows running securely.",
  },
  {
    title: "How we use it",
    body:
      "Account details, access logs, and operational records are used for sign-in, role enforcement, dispatch history, and system reliability.",
  },
  {
    title: "Your controls",
    body:
      "Access is role-based, sensitive actions are logged, and authenticated users can request account updates through the standard support channel.",
  },
];

export default function PrivacyPage() {
  return (
    <main className="min-h-screen px-6 py-8 lg:px-10">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-5xl flex-col gap-6">
        <Link href="/login" className="label-field inline-flex w-fit items-center gap-2 hover:text-ink">
          <ArrowLeft className="size-3.5" />
          Back to login
        </Link>

        <section className="glass relative overflow-hidden rounded-3xl p-8 lg:p-12">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(125,211,252,0.12),transparent_42%),radial-gradient(circle_at_85%_15%,rgba(200,160,240,0.1),transparent_38%)]" />
          <div className="relative flex flex-col gap-8">
            <div className="flex items-center gap-3">
              <span className="flex size-12 items-center justify-center rounded-2xl border border-line-soft bg-accent-faint text-accent">
                <Lock className="size-5" />
              </span>
              <div>
                <p className="label-eyebrow">Official Platform Policy</p>
                <h1 className="text-3xl font-semibold tracking-[-0.04em] text-ink lg:text-5xl">
                  Privacy Policy
                </h1>
              </div>
            </div>

            <p className="max-w-3xl text-sm leading-6 text-muted lg:text-base">
              This page explains how TransitOps handles account, operational,
              and audit data across the platform. It is written as an official
              product policy page for users signing into the system.
            </p>

            <div className="grid gap-4 lg:grid-cols-3">
              {sections.map((section) => (
                <article key={section.title} className="glass-elevated rounded-2xl border border-line-soft p-5">
                  <h2 className="mb-2 text-base font-semibold text-ink">{section.title}</h2>
                  <p className="text-sm leading-6 text-muted">{section.body}</p>
                </article>
              ))}
            </div>

            <div className="flex flex-wrap gap-3 text-sm text-muted">
              <span className="inline-flex items-center gap-2 rounded-full border border-line-soft bg-surface-2 px-4 py-2">
                <ShieldCheck className="size-4 text-accent" />
                Role-based access control
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-line-soft bg-surface-2 px-4 py-2">
                <Eye className="size-4 text-accent" />
                Audit-friendly activity logging
              </span>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
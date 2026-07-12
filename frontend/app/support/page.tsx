import Link from "next/link";
import { ArrowLeft, Headphones, Mail, MessageSquareHeart, ShieldCheck, UserCircle2 } from "lucide-react";

const supportChannels = [
  {
    label: "Email",
    value: "support@transitops.com",
    note: "Use this for access issues, login recovery, and operational requests.",
    icon: Mail,
  },
  {
    label: "CRM Handler",
    value: "Om Rashiya",
    note: "rashiyaom@gmail.com",
    icon: UserCircle2,
  },
  {
    label: "Escalation",
    value: "Contact him in case of any problems",
    note: "Operational issues, account blocks, or routing errors should be escalated here first.",
    icon: Headphones,
  },
];

const supportPrinciples = [
  "Official support responses are tied to the registered CRM contact.",
  "Security-sensitive requests may require identity verification.",
  "Login, OTP, and account lock issues are prioritized during business hours.",
];

export default function SupportPage() {
  return (
    <main className="min-h-screen px-6 py-8 lg:px-10">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-5xl flex-col gap-6">
        <Link href="/login" className="label-field inline-flex w-fit items-center gap-2 hover:text-ink">
          <ArrowLeft className="size-3.5" />
          Back to login
        </Link>

        <section className="glass relative overflow-hidden rounded-3xl p-8 lg:p-12">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(125,211,252,0.12),transparent_40%),radial-gradient(circle_at_80%_15%,rgba(200,160,240,0.1),transparent_35%)]" />
          <div className="relative flex flex-col gap-8">
            <div className="flex items-center gap-3">
              <span className="flex size-12 items-center justify-center rounded-2xl border border-line-soft bg-accent-faint text-accent">
                <ShieldCheck className="size-5" />
              </span>
              <div>
                <p className="label-eyebrow">Official Support Desk</p>
                <h1 className="text-3xl font-semibold tracking-[-0.04em] text-ink lg:text-5xl">
                  TransitOps Support
                </h1>
              </div>
            </div>

            <p className="max-w-3xl text-sm leading-6 text-muted lg:text-base">
              If you are blocked on login, need account help, or need help with
              the platform, use the official support contact below. This page is
              designed to look and feel like a proper product support endpoint.
            </p>

            <div className="grid gap-4 lg:grid-cols-3">
              {supportChannels.map(({ label, value, note, icon: Icon }) => (
                <article key={label} className="glass-elevated rounded-2xl border border-line-soft p-5">
                  <div className="mb-4 flex size-11 items-center justify-center rounded-2xl border border-line-soft bg-surface-2 text-accent">
                    <Icon className="size-5" />
                  </div>
                  <p className="label-eyebrow mb-2">{label}</p>
                  <h2 className="text-lg font-semibold text-ink">{value}</h2>
                  <p className="mt-2 text-sm leading-6 text-muted">{note}</p>
                </article>
              ))}
            </div>

            <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
              <div className="rounded-2xl border border-line-soft bg-surface-2 p-5">
                <div className="mb-3 flex items-center gap-2 text-ink">
                  <MessageSquareHeart className="size-4 text-accent" />
                  <span className="text-sm font-semibold">What to include in your request</span>
                </div>
                <ul className="space-y-2 text-sm leading-6 text-muted">
                  <li>• Your registered email address</li>
                  <li>• A short description of the issue</li>
                  <li>• Any error message or screenshot you saw</li>
                  <li>• Whether the issue is affecting login, OTP, or dashboard access</li>
                </ul>
              </div>

              <div className="rounded-2xl border border-line-soft bg-surface-2 p-5">
                <p className="label-eyebrow mb-3">Support Policy</p>
                <ul className="space-y-3 text-sm leading-6 text-muted">
                  {supportPrinciples.map((item) => (
                    <li key={item} className="flex gap-2">
                      <span className="mt-2 size-1.5 shrink-0 rounded-full bg-accent" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}